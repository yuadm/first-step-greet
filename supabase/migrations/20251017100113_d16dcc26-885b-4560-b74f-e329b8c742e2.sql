-- Drop the insecure policy that allows all authenticated users to view all leaves
DROP POLICY IF EXISTS "Authenticated users can view all leave requests" ON leave_requests;

-- Create a secure branch-aware SELECT policy
CREATE POLICY "Users can view leaves from accessible branches"
ON leave_requests
FOR SELECT
TO authenticated
USING (
  is_admin_user() 
  OR 
  employee_id IN (
    SELECT e.id 
    FROM employees e
    WHERE e.branch_id IN (
      SELECT get_user_accessible_branches(auth.uid())
    )
  )
);