-- Update RLS policies for care_worker_statements to allow normal users with branch access

-- Drop the existing policy that might be too restrictive
DROP POLICY IF EXISTS "Users with compliance permissions can view all statements" ON care_worker_statements;

-- Add policy for normal users to view statements from their accessible branches
CREATE POLICY "Normal users can view statements from accessible branches" 
ON care_worker_statements 
FOR SELECT 
USING (
  -- Admins can see everything (keep existing admin access)
  is_admin_user() 
  OR 
  -- Employees can see their assigned statements (keep existing employee access)
  (assigned_employee_id IN (
    SELECT employees.id
    FROM employees
    WHERE employees.user_id = auth.uid()
  ))
  OR
  -- Normal users can see statements from their accessible branches
  (
    branch_id IN (
      SELECT get_user_accessible_branches(auth.uid())
    )
    AND 
    user_has_permission(auth.uid(), 'page_action', 'compliance:view')
  )
);