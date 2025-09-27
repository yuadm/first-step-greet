-- First, remove the overly permissive policy that allows public read access to all clients
DROP POLICY IF EXISTS "Allow public read access to clients" ON public.clients;

-- Create a new policy that respects branch access permissions
CREATE POLICY "Users can view clients from accessible branches" 
ON public.clients 
FOR SELECT 
USING (
  is_admin_user() OR (
    branch_id IN (
      SELECT get_user_accessible_branches(auth.uid())
    )
  )
);

-- Update create policy to respect branch access
DROP POLICY IF EXISTS "Users can create clients" ON public.clients;
CREATE POLICY "Users can create clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  is_admin_user() OR (
    branch_id IN (
      SELECT get_user_accessible_branches(auth.uid())
    )
  )
);

-- Update policy to allow users to update clients only in their accessible branches
DROP POLICY IF EXISTS "Users can update clients" ON public.clients;
CREATE POLICY "Users can update clients" 
ON public.clients 
FOR UPDATE 
USING (
  is_admin_user() OR (
    branch_id IN (
      SELECT get_user_accessible_branches(auth.uid())
    )
  )
)
WITH CHECK (
  is_admin_user() OR (
    branch_id IN (
      SELECT get_user_accessible_branches(auth.uid())
    )
  )
);

-- Update policy to allow users to delete clients only in their accessible branches
DROP POLICY IF EXISTS "Users can delete clients" ON public.clients;
CREATE POLICY "Users can delete clients" 
ON public.clients 
FOR DELETE 
USING (
  is_admin_user() OR (
    branch_id IN (
      SELECT get_user_accessible_branches(auth.uid())
    )
  )
);