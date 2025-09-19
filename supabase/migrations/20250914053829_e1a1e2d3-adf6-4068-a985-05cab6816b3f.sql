-- Allow negative leave balances by updating the validation functions

CREATE OR REPLACE FUNCTION adjust_employee_leave_balance(
    p_employee_id UUID,
    p_days NUMERIC,
    p_operation TEXT
) RETURNS JSONB
SET search_path = 'public'
LANGUAGE plpgsql AS $$
DECLARE
    v_employee employees%ROWTYPE;
    v_previous_taken NUMERIC;
    v_previous_remaining NUMERIC;
    v_new_taken NUMERIC;
    v_new_remaining NUMERIC;
BEGIN
    -- Get employee with row lock
    SELECT * INTO v_employee 
    FROM employees 
    WHERE id = p_employee_id 
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Employee not found'
        );
    END IF;
    
    v_previous_taken := COALESCE(v_employee.leave_taken, 0);
    v_previous_remaining := COALESCE(v_employee.remaining_leave_days, v_employee.leave_allowance);
    
    -- Apply the operation (removed negative balance validation)
    IF p_operation = 'add' THEN
        v_new_taken := v_previous_taken + p_days;
        v_new_remaining := v_previous_remaining - p_days;
    ELSIF p_operation = 'subtract' THEN
        v_new_taken := v_previous_taken - p_days;
        v_new_remaining := v_previous_remaining + p_days;
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid operation. Must be add or subtract'
        );
    END IF;
    
    -- Update employee balances (no validation for negative balances)
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
$$;