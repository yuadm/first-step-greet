-- Add audit trail columns to compliance_period_records
ALTER TABLE compliance_period_records 
ADD COLUMN created_by UUID,
ADD COLUMN updated_by UUID,
ADD COLUMN deleted_by UUID,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Add audit trail columns to client_compliance_period_records  
ALTER TABLE client_compliance_period_records
ADD COLUMN created_by UUID,
ADD COLUMN updated_by UUID, 
ADD COLUMN deleted_by UUID,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Add audit trail columns to care_worker_statements (if not already present)
-- These might already exist, so we'll check and add only if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_worker_statements' AND column_name = 'updated_by') THEN
        ALTER TABLE care_worker_statements ADD COLUMN updated_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_worker_statements' AND column_name = 'deleted_by') THEN
        ALTER TABLE care_worker_statements ADD COLUMN deleted_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'care_worker_statements' AND column_name = 'deleted_at') THEN
        ALTER TABLE care_worker_statements ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- Add audit trail columns to client_spot_check_records
ALTER TABLE client_spot_check_records
ADD COLUMN created_by UUID,
ADD COLUMN updated_by UUID,
ADD COLUMN deleted_by UUID, 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Create function to get user display name (simple approach)
CREATE OR REPLACE FUNCTION get_user_display_name(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_name TEXT;
    employee_name TEXT;
BEGIN
    -- First try to get from employees table
    SELECT name INTO employee_name
    FROM employees 
    WHERE id = user_id OR employees.user_id = user_id;
    
    IF employee_name IS NOT NULL THEN
        RETURN employee_name;
    END IF;
    
    -- If not found in employees, try auth.users (for admin users)
    SELECT COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name', 
        email
    ) INTO user_name
    FROM auth.users 
    WHERE id = user_id;
    
    RETURN COALESCE(user_name, 'Unknown User');
END;
$$;