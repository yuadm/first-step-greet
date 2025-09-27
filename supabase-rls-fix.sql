-- Fix RLS policies to allow normal users access to key functionality
BEGIN;

-- Update signing_requests policies to allow authenticated users to create requests
-- while keeping admin control over updates and deletions

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage signing requests" ON public.signing_requests;

-- Create new policies with more granular access
CREATE POLICY "Authenticated users can create signing requests" 
ON public.signing_requests 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update signing requests" 
ON public.signing_requests 
FOR UPDATE 
USING (is_admin_user())
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can delete signing requests" 
ON public.signing_requests 
FOR DELETE 
USING (is_admin_user());

-- Keep existing view policies
-- (Users can view their own signing requests and public can view by token are already in place)

COMMIT;