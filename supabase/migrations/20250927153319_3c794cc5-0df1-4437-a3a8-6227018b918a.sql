-- Add policy to allow authenticated users to create leave types
CREATE POLICY "Authenticated users can create leave types" 
ON public.leave_types 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);