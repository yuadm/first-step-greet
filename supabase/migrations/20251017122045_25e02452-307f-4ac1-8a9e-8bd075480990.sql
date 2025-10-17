-- Remove ambiguous overload to fix RPC resolution
DROP FUNCTION IF EXISTS public.delete_employee_document(UUID, TEXT);

-- Recreate canonical function to be safe (idempotent)
CREATE OR REPLACE FUNCTION public.delete_employee_document(
  p_employee_id UUID,
  p_document_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE document_tracker
  SET 
    documents = (
      SELECT COALESCE(jsonb_agg(doc), '[]'::jsonb)
      FROM jsonb_array_elements(documents) AS doc
      WHERE (doc->>'id')::uuid != p_document_id
    ),
    updated_at = NOW()
  WHERE employee_id = p_employee_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_employee_document(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_employee_document(UUID, UUID) TO anon;