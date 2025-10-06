-- Allow authenticated users to create compliance types
CREATE POLICY "Authenticated users can create compliance types" 
ON public.compliance_types 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update compliance types  
CREATE POLICY "Authenticated users can update compliance types"
ON public.compliance_types
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete compliance types
CREATE POLICY "Authenticated users can delete compliance types"
ON public.compliance_types
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);