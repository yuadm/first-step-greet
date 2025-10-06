-- Create functions for client compliance automation similar to employee ones

-- Function to generate client compliance records for a period
CREATE OR REPLACE FUNCTION public.generate_client_compliance_records_for_period(p_compliance_type_id uuid, p_period_identifier text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  records_created INTEGER := 0;
  client_record RECORD;
  automation_settings RECORD;
BEGIN
  -- Get automation settings
  SELECT * INTO automation_settings 
  FROM compliance_automation_settings 
  LIMIT 1;
  
  -- Only proceed if auto generation is enabled
  IF NOT automation_settings.auto_generate_records THEN
    RETURN 0;
  END IF;

  -- Generate records for all active clients
  FOR client_record IN 
    SELECT id FROM clients WHERE is_active = true
  LOOP
    -- Check if record already exists
    IF NOT EXISTS (
      SELECT 1 FROM client_compliance_period_records 
      WHERE client_compliance_type_id = p_compliance_type_id 
      AND client_id = client_record.id 
      AND period_identifier = p_period_identifier
    ) THEN
      -- Create new client compliance record
      INSERT INTO client_compliance_period_records (
        client_compliance_type_id,
        client_id,
        period_identifier,
        status,
        auto_generated,
        grace_period_end,
        completion_date,
        notes
      ) VALUES (
        p_compliance_type_id,
        client_record.id,
        p_period_identifier,
        'pending',
        true,
        CURRENT_DATE + INTERVAL '1 day' * automation_settings.grace_period_days,
        '',
        'Auto-generated for period: ' || p_period_identifier
      );
      
      records_created := records_created + 1;
    END IF;
  END LOOP;
  
  RETURN records_created;
END;
$function$;

-- Function to update client compliance statuses
CREATE OR REPLACE FUNCTION public.update_client_compliance_statuses()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  records_updated INTEGER := 0;
  automation_settings RECORD;
BEGIN
  -- Get automation settings
  SELECT * INTO automation_settings 
  FROM compliance_automation_settings 
  LIMIT 1;
  
  -- Update overdue status for pending client records
  UPDATE client_compliance_period_records
  SET 
    is_overdue = true,
    status = 'overdue'
  WHERE 
    status = 'pending' 
    AND grace_period_end < CURRENT_DATE
    AND is_overdue = false;
    
  GET DIAGNOSTICS records_updated = ROW_COUNT;
  
  RETURN records_updated;
END;
$function$;