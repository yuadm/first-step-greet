-- Create function to calculate period end dates
CREATE OR REPLACE FUNCTION public.get_period_end_date(p_frequency TEXT, p_period_identifier TEXT)
RETURNS DATE
LANGUAGE plpgsql
AS $$
DECLARE
  year_val INT;
  quarter_val INT;
  half_val INT;
  week_val INT;
BEGIN
  CASE p_frequency
    WHEN 'annual' THEN
      -- Period: "2025" -> End: 2025-12-31
      RETURN (p_period_identifier || '-12-31')::DATE;
    
    WHEN 'quarterly' THEN
      -- Period: "2025-Q4" -> End: 2025-12-31
      year_val := SPLIT_PART(p_period_identifier, '-Q', 1)::INT;
      quarter_val := SPLIT_PART(p_period_identifier, '-Q', 2)::INT;
      RETURN (DATE_TRUNC('quarter', MAKE_DATE(year_val, quarter_val * 3, 1)) 
             + INTERVAL '3 months' - INTERVAL '1 day')::DATE;
    
    WHEN 'monthly' THEN
      -- Period: "2025-10" -> End: 2025-10-31
      RETURN (DATE_TRUNC('month', (p_period_identifier || '-01')::DATE) 
              + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    WHEN 'bi-annual' THEN
      -- Period: "2025-H2" -> End: 2025-12-31
      year_val := SPLIT_PART(p_period_identifier, '-H', 1)::INT;
      half_val := SPLIT_PART(p_period_identifier, '-H', 2)::INT;
      IF half_val = 1 THEN
        RETURN MAKE_DATE(year_val, 6, 30);
      ELSE
        RETURN MAKE_DATE(year_val, 12, 31);
      END IF;
    
    WHEN 'weekly' THEN
      -- Period: "2025-W40" -> End: Last day of week 40
      year_val := SPLIT_PART(p_period_identifier, '-W', 1)::INT;
      week_val := SPLIT_PART(p_period_identifier, '-W', 2)::INT;
      -- Calculate the last day of the ISO week
      RETURN (DATE_TRUNC('week', MAKE_DATE(year_val, 1, 4)) 
              + (week_val - 1) * INTERVAL '1 week' 
              + INTERVAL '6 days')::DATE;
    
    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

-- Update generate_compliance_records_for_period to use period end dates
CREATE OR REPLACE FUNCTION public.generate_compliance_records_for_period(p_compliance_type_id uuid, p_period_identifier text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

  -- Generate records for all active employees
  FOR emp_record IN 
    SELECT id FROM employees WHERE is_active = true
  LOOP
    -- Check if record already exists
    IF NOT EXISTS (
      SELECT 1 FROM compliance_period_records 
      WHERE compliance_type_id = p_compliance_type_id 
      AND employee_id = emp_record.id 
      AND period_identifier = p_period_identifier
    ) THEN
      -- Create new compliance record with grace_period_end set to period end date
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
        'Auto-generated for period: ' || p_period_identifier
      );
      
      records_created := records_created + 1;
    END IF;
  END LOOP;
  
  RETURN records_created;
END;
$$;

-- Update generate_client_compliance_records_for_period to use period end dates
CREATE OR REPLACE FUNCTION public.generate_client_compliance_records_for_period(p_compliance_type_id uuid, p_period_identifier text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      -- Create new client compliance record with grace_period_end set to period end date
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
        'Auto-generated for period: ' || p_period_identifier
      );
      
      records_created := records_created + 1;
    END IF;
  END LOOP;
  
  RETURN records_created;
END;
$$;

-- Fix existing pending employee compliance records
UPDATE compliance_period_records cpr
SET grace_period_end = get_period_end_date(ct.frequency, cpr.period_identifier)
FROM compliance_types ct
WHERE cpr.compliance_type_id = ct.id
AND cpr.status = 'pending';

-- Fix existing pending client compliance records
UPDATE client_compliance_period_records ccpr
SET grace_period_end = get_period_end_date(cct.frequency, ccpr.period_identifier)
FROM client_compliance_types cct
WHERE ccpr.client_compliance_type_id = cct.id
AND ccpr.status = 'pending';