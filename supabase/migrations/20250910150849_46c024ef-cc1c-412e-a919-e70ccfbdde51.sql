-- Add UPDATE policy for care worker statements to allow non-admin users with proper permissions
CREATE POLICY "Users with permissions can update statements"
ON public.care_worker_statements
FOR UPDATE
TO authenticated
USING (
  is_admin_user() OR 
  user_has_permission(auth.uid(), 'page_action', 'care-worker-statements:edit')
)
WITH CHECK (
  is_admin_user() OR 
  user_has_permission(auth.uid(), 'page_action', 'care-worker-statements:edit')
);