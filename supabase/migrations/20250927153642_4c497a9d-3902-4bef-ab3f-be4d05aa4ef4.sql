-- Add policy to allow authenticated users to update leave types
CREATE POLICY "Authenticated users can update leave types" 
ON public.leave_types 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);