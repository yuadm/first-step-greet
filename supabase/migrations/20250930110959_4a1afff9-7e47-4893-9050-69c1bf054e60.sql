-- Fix search_path for client archival functions
DROP FUNCTION IF EXISTS public.check_client_archival_readiness(uuid, integer);
CREATE OR REPLACE FUNCTION public.check_client_archival_readiness(p_compliance_type_id uuid, p_year integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if all client compliance records for the type/year are completed or overdue beyond grace period
  RETURN NOT EXISTS (
    SELECT 1 FROM client_compliance_period_records ccpr
    WHERE ccpr.client_compliance_type_id = p_compliance_type_id
    AND EXTRACT(YEAR FROM CASE 
      WHEN ccpr.completion_date ~ '^\d{4}-\d{2}-\d{2}$' 
      THEN ccpr.completion_date::DATE 
      ELSE CURRENT_DATE 
    END) = p_year
    AND ccpr.status IN ('pending', 'in_progress')
    AND (ccpr.grace_period_end IS NULL OR ccpr.grace_period_end > CURRENT_DATE - INTERVAL '30 days')
  );
END;
$$;

DROP FUNCTION IF EXISTS public.generate_client_compliance_statistics(uuid, integer);
CREATE OR REPLACE FUNCTION public.generate_client_compliance_statistics(p_compliance_type_id uuid, p_year integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_records', COUNT(*),
    'completed_records', COUNT(*) FILTER (WHERE status = 'completed'),
    'overdue_records', COUNT(*) FILTER (WHERE status = 'overdue'),
    'pending_records', COUNT(*) FILTER (WHERE status = 'pending'),
    'completion_rate', ROUND(
      (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2
    ),
    'average_completion_days', AVG(
      CASE 
        WHEN status = 'completed' AND completion_date ~ '^\d{4}-\d{2}-\d{2}$'
        THEN EXTRACT(DAY FROM completion_date::DATE - created_at::DATE)
        ELSE NULL
      END
    ),
    'unique_clients', COUNT(DISTINCT client_id),
    'period_identifiers', array_agg(DISTINCT period_identifier ORDER BY period_identifier)
  ) INTO stats
  FROM client_compliance_period_records
  WHERE client_compliance_type_id = p_compliance_type_id
  AND EXTRACT(YEAR FROM CASE 
    WHEN completion_date ~ '^\d{4}-\d{2}-\d{2}$' 
    THEN completion_date::DATE 
    ELSE created_at::DATE 
  END) = p_year;
  
  RETURN COALESCE(stats, '{}'::jsonb);
END;
$$;

-- Create function to get all compliance automation cron job statuses
CREATE OR REPLACE FUNCTION public.get_all_compliance_automation_status()
RETURNS TABLE(job_name text, schedule text, active boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    jobname::text as job_name,
    schedule::text,
    active
  FROM cron.job 
  WHERE jobname LIKE '%compliance%'
  ORDER BY jobname;
$$;