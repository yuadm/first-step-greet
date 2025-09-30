-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Client-specific archival readiness check function
CREATE OR REPLACE FUNCTION public.check_client_archival_readiness(p_compliance_type_id uuid, p_year integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Client compliance statistics generation function
CREATE OR REPLACE FUNCTION public.generate_client_compliance_statistics(p_compliance_type_id uuid, p_year integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Schedule compliance-automation to run daily at 2 AM
SELECT cron.schedule(
  'run-compliance-automation-daily',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-automation',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
    body := jsonb_build_object('scheduled', true, 'timestamp', now())
  ) as request_id;
  $$
);

-- Schedule compliance-data-archival to run monthly on the 1st at 3 AM
SELECT cron.schedule(
  'run-compliance-archival-monthly',
  '0 3 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-data-archival',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
    body := jsonb_build_object('scheduled', true, 'timestamp', now())
  ) as request_id;
  $$
);

-- Schedule compliance-notifications to run daily at 9 AM
SELECT cron.schedule(
  'run-compliance-notifications-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
    body := jsonb_build_object('scheduled', true, 'timestamp', now())
  ) as request_id;
  $$
);