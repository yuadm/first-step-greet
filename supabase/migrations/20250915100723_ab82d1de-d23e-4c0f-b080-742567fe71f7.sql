-- Check the current function definition to see the issue
-- First, let's see the current update_leave_status_with_balance function
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'update_leave_status_with_balance';