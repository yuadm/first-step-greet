-- Add INSERT policy for care worker statements to allow non-admin users with proper permissions
CREATE POLICY "Users with permissions can create statements"
ON public.care_worker_statements
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin_user() OR 
  user_has_permission(auth.uid(), 'page_action', 'care-worker-statements:create')
);