-- Enable RLS on client_compliance_types (safe if already enabled)
ALTER TABLE public.client_compliance_types ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user (including admins) to INSERT new client compliance types
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'client_compliance_types'
      AND policyname = 'Authenticated users can create client compliance types'
  ) THEN
    CREATE POLICY "Authenticated users can create client compliance types"
    ON public.client_compliance_types
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END$$;