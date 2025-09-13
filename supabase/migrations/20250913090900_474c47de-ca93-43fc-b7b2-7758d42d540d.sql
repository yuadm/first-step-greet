-- Create function to atomically adjust employee leave balance
CREATE OR REPLACE FUNCTION public.adjust_employee_leave_balance(
    p_employee_id UUID,
    p_days INTEGER,
    p_operation TEXT -- 'add' or 'subtract'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_taken NUMERIC;
    current_remaining NUMERIC;
    leave_allowance INTEGER;
    new_taken NUMERIC;
    new_remaining NUMERIC;
    result JSONB;
BEGIN
    -- Get current values and lock the row
    SELECT 
        COALESCE(leave_taken, 0),
        COALESCE(remaining_leave_days, 28),
        COALESCE(leave_allowance, 28)
    INTO current_taken, current_remaining, leave_allowance
    FROM employees 
    WHERE id = p_employee_id
    FOR UPDATE;
    
    -- Check if employee exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Employee not found',
            'employee_id', p_employee_id
        );
    END IF;
    
    -- Calculate new values
    IF p_operation = 'add' THEN
        new_taken := current_taken + p_days;
        new_remaining := GREATEST(0, current_remaining - p_days);
    ELSIF p_operation = 'subtract' THEN
        new_taken := GREATEST(0, current_taken - p_days);
        new_remaining := LEAST(leave_allowance, current_remaining + p_days);
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid operation. Must be add or subtract',
            'operation', p_operation
        );
    END IF;
    
    -- Update the employee record
    UPDATE employees 
    SET 
        leave_taken = new_taken,
        remaining_leave_days = new_remaining
    WHERE id = p_employee_id;
    
    -- Return success result with updated values
    RETURN jsonb_build_object(
        'success', true,
        'employee_id', p_employee_id,
        'operation', p_operation,
        'days_adjusted', p_days,
        'previous_taken', current_taken,
        'new_taken', new_taken,
        'previous_remaining', current_remaining,
        'new_remaining', new_remaining
    );
END;
$$;

-- Create function to update leave status with automatic balance adjustments
CREATE OR REPLACE FUNCTION public.update_leave_status_with_balance(
    p_leave_id UUID,
    p_new_status TEXT,
    p_manager_notes TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    leave_record RECORD;
    leave_type_record RECORD;
    balance_result JSONB;
    final_result JSONB;
BEGIN
    -- Get leave details and lock the row
    SELECT * INTO leave_record
    FROM leave_requests 
    WHERE id = p_leave_id
    FOR UPDATE;
    
    -- Check if leave exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Leave request not found',
            'leave_id', p_leave_id
        );
    END IF;
    
    -- Get leave type details
    SELECT * INTO leave_type_record
    FROM leave_types
    WHERE id = leave_record.leave_type_id;
    
    -- Update leave status first
    UPDATE leave_requests
    SET 
        status = p_new_status,
        manager_notes = COALESCE(p_manager_notes, manager_notes),
        approved_date = CASE WHEN p_new_status = 'approved' THEN NOW() ELSE approved_date END,
        rejected_date = CASE WHEN p_new_status = 'rejected' THEN NOW() ELSE rejected_date END,
        approved_by = CASE WHEN p_new_status = 'approved' THEN COALESCE(p_user_id, approved_by) ELSE approved_by END,
        rejected_by = CASE WHEN p_new_status = 'rejected' THEN COALESCE(p_user_id, rejected_by) ELSE rejected_by END
    WHERE id = p_leave_id;
    
    -- Handle balance adjustments only for leave types that reduce balance
    IF leave_type_record.reduces_balance THEN
        -- Status change logic
        IF leave_record.status = 'approved' AND p_new_status != 'approved' THEN
            -- Was approved, now not approved - restore balance
            SELECT adjust_employee_leave_balance(
                leave_record.employee_id,
                leave_record.days_requested,
                'subtract'
            ) INTO balance_result;
        ELSIF leave_record.status != 'approved' AND p_new_status = 'approved' THEN
            -- Was not approved, now approved - deduct balance
            SELECT adjust_employee_leave_balance(
                leave_record.employee_id,
                leave_record.days_requested,
                'add'
            ) INTO balance_result;
        END IF;
    END IF;
    
    -- Build final result
    final_result := jsonb_build_object(
        'success', true,
        'leave_id', p_leave_id,
        'previous_status', leave_record.status,
        'new_status', p_new_status,
        'reduces_balance', COALESCE(leave_type_record.reduces_balance, false)
    );
    
    -- Add balance adjustment info if it occurred
    IF balance_result IS NOT NULL THEN
        final_result := final_result || jsonb_build_object('balance_adjustment', balance_result);
    END IF;
    
    RETURN final_result;
END;
$$;