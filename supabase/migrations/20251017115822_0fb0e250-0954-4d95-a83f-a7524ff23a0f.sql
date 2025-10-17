-- Drop the old delete_employee_document function that expects UUID for p_document_id
-- This resolves the PGRST203 function overloading error
DROP FUNCTION IF EXISTS public.delete_employee_document(p_employee_id UUID, p_document_id UUID);
