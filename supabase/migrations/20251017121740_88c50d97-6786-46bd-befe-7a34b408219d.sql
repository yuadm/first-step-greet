
-- Function to delete a document from an employee's JSONB documents array
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
  -- Update the documents JSONB array by filtering out the document with matching id
  UPDATE document_tracker
  SET 
    documents = (
      SELECT jsonb_agg(doc)
      FROM jsonb_array_elements(documents) AS doc
      WHERE (doc->>'id')::uuid != p_document_id
    ),
    updated_at = NOW()
  WHERE employee_id = p_employee_id;
  
  -- If no documents remain, optionally delete the tracker record
  -- Uncomment the following if you want to clean up empty tracker records:
  -- DELETE FROM document_tracker 
  -- WHERE employee_id = p_employee_id 
  -- AND (documents IS NULL OR jsonb_array_length(documents) = 0);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.delete_employee_document(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_employee_document(UUID, UUID) TO anon;
