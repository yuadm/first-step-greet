-- Update RLS policy for employees to view their assigned care worker statements
-- This replaces the existing policy to work with user_metadata.employee_id
DROP POLICY IF EXISTS "Employees can view their assigned statements" ON public.care_worker_statements;

CREATE POLICY "Employees can view their assigned statements via metadata"
ON public.care_worker_statements
FOR SELECT
TO authenticated
USING (
  assigned_employee_id::text = (auth.jwt()->>'user_metadata'->>'employee_id')
);