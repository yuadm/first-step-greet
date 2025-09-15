-- Drop all versions of the adjust_employee_leave_balance function to avoid conflicts
DROP FUNCTION IF EXISTS public.adjust_employee_leave_balance(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.adjust_employee_leave_balance(uuid, integer, text);

-- Create a single, clean version of the function
CREATE OR REPLACE FUNCTION public.adjust_employee_leave_balance(p_employee_id uuid, p_days numeric, p_operation text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_employee_record RECORD;
    v_previous_taken NUMERIC;
    v_previous_remaining NUMERIC;
    v_new_taken NUMERIC;
    v_new_remaining NUMERIC;
    v_allowance NUMERIC;
BEGIN
    -- Get employee record with row lock and explicit column selection
    SELECT 
        id,
        leave_taken,
        remaining_leave_days,
        leave_allowance
    INTO v_employee_record
    FROM employees 
    WHERE id = p_employee_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Employee not found',
            'employee_id', p_employee_id
        );
    END IF;
    
    -- Use explicit record field references to avoid ambiguity
    v_previous_taken := COALESCE(v_employee_record.leave_taken, 0);
    v_previous_remaining := COALESCE(v_employee_record.remaining_leave_days, 28);
    v_allowance := COALESCE(v_employee_record.leave_allowance, 28);
    
    -- Apply the operation
    IF p_operation = 'add' THEN
        v_new_taken := v_previous_taken + p_days;
        v_new_remaining := v_previous_remaining - p_days;
    ELSIF p_operation = 'subtract' THEN
        v_new_taken := v_previous_taken - p_days;
        v_new_remaining := v_previous_remaining + p_days;
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid operation. Must be add or subtract',
            'operation', p_operation
        );
    END IF;
    
    -- Update employee balances
    UPDATE employees 
    SET 
        leave_taken = v_new_taken,
        remaining_leave_days = v_new_remaining
    WHERE id = p_employee_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'employee_id', p_employee_id,
        'operation', p_operation,
        'days_adjusted', p_days,
        'previous_taken', v_previous_taken,
        'new_taken', v_new_taken,
        'previous_remaining', v_previous_remaining,
        'new_remaining', v_new_remaining
    );
END;
$function$;