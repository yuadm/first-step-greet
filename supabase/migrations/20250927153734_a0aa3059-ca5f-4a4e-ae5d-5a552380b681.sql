-- Add policy to allow authenticated users to delete leave types
CREATE POLICY "Authenticated users can delete leave types" 
ON public.leave_types 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);