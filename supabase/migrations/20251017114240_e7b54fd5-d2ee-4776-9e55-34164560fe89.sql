-- Create function to upsert a document into an employee's document tracker
CREATE OR REPLACE FUNCTION public.upsert_employee_document(
  p_employee_id UUID,
  p_document JSONB,
  p_country TEXT DEFAULT NULL,
  p_nationality_status TEXT DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tracker_id UUID;
  v_document_id TEXT;
  v_result JSONB;
BEGIN
  -- Generate a document ID if not provided
  IF p_document->>'id' IS NULL THEN
    v_document_id := gen_random_uuid()::TEXT;
    p_document := jsonb_set(p_document, '{id}', to_jsonb(v_document_id));
  ELSE
    v_document_id := p_document->>'id';
  END IF;
  
  -- Add timestamps if not present
  IF p_document->>'created_at' IS NULL THEN
    p_document := jsonb_set(p_document, '{created_at}', to_jsonb(now()::TEXT));
  END IF;
  p_document := jsonb_set(p_document, '{updated_at}', to_jsonb(now()::TEXT));
  
  -- Check if document tracker exists for this employee
  SELECT id INTO v_tracker_id
  FROM document_tracker
  WHERE employee_id = p_employee_id;
  
  IF v_tracker_id IS NULL THEN
    -- Create new tracker with the document
    INSERT INTO document_tracker (
      employee_id,
      branch_id,
      country,
      nationality_status,
      documents,
      created_at,
      updated_at
    ) VALUES (
      p_employee_id,
      p_branch_id,
      p_country,
      p_nationality_status,
      jsonb_build_array(p_document),
      now(),
      now()
    ) RETURNING id INTO v_tracker_id;
  ELSE
    -- Check if document with this ID already exists
    IF EXISTS (
      SELECT 1 FROM document_tracker dt,
      jsonb_array_elements(dt.documents) AS doc
      WHERE dt.id = v_tracker_id
      AND doc->>'id' = v_document_id
    ) THEN
      -- Update existing document
      UPDATE document_tracker
      SET 
        documents = (
          SELECT jsonb_agg(
            CASE 
              WHEN doc->>'id' = v_document_id THEN p_document
              ELSE doc
            END
          )
          FROM jsonb_array_elements(documents) AS doc
        ),
        updated_at = now(),
        country = COALESCE(p_country, country),
        nationality_status = COALESCE(p_nationality_status, nationality_status),
        branch_id = COALESCE(p_branch_id, branch_id)
      WHERE id = v_tracker_id;
    ELSE
      -- Add new document to array
      UPDATE document_tracker
      SET 
        documents = documents || p_document,
        updated_at = now(),
        country = COALESCE(p_country, country),
        nationality_status = COALESCE(p_nationality_status, nationality_status),
        branch_id = COALESCE(p_branch_id, branch_id)
      WHERE id = v_tracker_id;
    END IF;
  END IF;
  
  -- Return the result
  v_result := jsonb_build_object(
    'tracker_id', v_tracker_id,
    'document', p_document
  );
  
  RETURN v_result;
END;
$$;