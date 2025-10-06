-- Update employee compliance generation to filter by created_at date
CREATE OR REPLACE FUNCTION public.generate_compliance_records_for_period(p_compliance_type_id uuid, p_period_identifier text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  records_created INTEGER := 0;
  emp_record RECORD;
  automation_settings RECORD;
  compliance_frequency TEXT;
  period_end_date DATE;
BEGIN
  -- Get automation settings
  SELECT * INTO automation_settings 
  FROM compliance_automation_settings 
  LIMIT 1;
  
  -- Only proceed if auto generation is enabled
  IF NOT automation_settings.auto_generate_records THEN
    RETURN 0;
  END IF;

  -- Get the frequency for this compliance type
  SELECT frequency INTO compliance_frequency
  FROM compliance_types
  WHERE id = p_compliance_type_id;

  -- Calculate the period end date
  period_end_date := get_period_end_date(compliance_frequency, p_period_identifier);

  -- Generate records only for employees that existed during or before the period
  FOR emp_record IN 
    SELECT id, created_at FROM employees 
    WHERE is_active = true 
    AND created_at::date <= period_end_date
  LOOP
    -- Check if record already exists
    IF NOT EXISTS (
      SELECT 1 FROM compliance_period_records 
      WHERE compliance_type_id = p_compliance_type_id 
      AND employee_id = emp_record.id 
      AND period_identifier = p_period_identifier
    ) THEN
      -- Create new compliance record
      INSERT INTO compliance_period_records (
        compliance_type_id,
        employee_id,
        period_identifier,
        status,
        auto_generated,
        grace_period_end,
        completion_date,
        notes
      ) VALUES (
        p_compliance_type_id,
        emp_record.id,
        p_period_identifier,
        'pending',
        true,
        period_end_date,
        '',
        ''
      );
      
      records_created := records_created + 1;
    END IF;
  END LOOP;
  
  RETURN records_created;
END;
$function$;

-- Update client compliance generation to filter by created_at date
CREATE OR REPLACE FUNCTION public.generate_client_compliance_records_for_period(p_compliance_type_id uuid, p_period_identifier text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  records_created INTEGER := 0;
  client_record RECORD;
  automation_settings RECORD;
  compliance_frequency TEXT;
  period_end_date DATE;
BEGIN
  -- Get automation settings
  SELECT * INTO automation_settings 
  FROM compliance_automation_settings 
  LIMIT 1;
  
  -- Only proceed if auto generation is enabled
  IF NOT automation_settings.auto_generate_records THEN
    RETURN 0;
  END IF;

  -- Get the frequency for this compliance type
  SELECT frequency INTO compliance_frequency
  FROM client_compliance_types
  WHERE id = p_compliance_type_id;

  -- Calculate the period end date
  period_end_date := get_period_end_date(compliance_frequency, p_period_identifier);

  -- Generate records only for clients that existed during or before the period
  FOR client_record IN 
    SELECT id, created_at FROM clients 
    WHERE is_active = true 
    AND created_at::date <= period_end_date
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
        period_end_date,
        '',
        ''
      );
      
      records_created := records_created + 1;
    END IF;
  END LOOP;
  
  RETURN records_created;
END;
$function$;