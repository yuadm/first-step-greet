-- Drop the manager policies that bypass branch access
DROP POLICY IF EXISTS "Managers can view all leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Managers can manage all leave requests" ON leave_requests;

-- Create a new manager policy that respects branch access
CREATE POLICY "Managers can view leaves from accessible branches"
ON leave_requests
FOR SELECT
TO authenticated
USING (
  is_admin_user() 
  OR 
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND role = 'manager'
    )
    AND employee_id IN (
      SELECT e.id 
      FROM employees e
      WHERE e.branch_id IN (
        SELECT get_user_accessible_branches(auth.uid())
      )
    )
  )
);

-- Create a manager policy for updates that respects branch access
CREATE POLICY "Managers can update leaves from accessible branches"
ON leave_requests
FOR UPDATE
TO authenticated
USING (
  is_admin_user() 
  OR 
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND role = 'manager'
    )
    AND employee_id IN (
      SELECT e.id 
      FROM employees e
      WHERE e.branch_id IN (
        SELECT get_user_accessible_branches(auth.uid())
      )
    )
  )
)
WITH CHECK (
  is_admin_user() 
  OR 
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND role = 'manager'
    )
    AND employee_id IN (
      SELECT e.id 
      FROM employees e
      WHERE e.branch_id IN (
        SELECT get_user_accessible_branches(auth.uid())
      )
    )
  )
);