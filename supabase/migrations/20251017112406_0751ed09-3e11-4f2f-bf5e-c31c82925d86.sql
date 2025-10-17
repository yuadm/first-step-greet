
-- Drop all existing versions of upsert_employee_document to resolve overloading conflict
DROP FUNCTION IF EXISTS public.upsert_employee_document(uuid, jsonb, text, text, uuid);
DROP FUNCTION IF EXISTS public.upsert_employee_document(uuid, jsonb, character varying, character varying, uuid);

-- Create the definitive version with TEXT types (consistent with table schema)
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
  v_documents JSONB;
  v_doc_id TEXT;
  v_updated_documents JSONB;
  v_found BOOLEAN := FALSE;
BEGIN
  -- Get or create the tracker record for this employee
  SELECT id, documents INTO v_tracker_id, v_documents
  FROM document_tracker
  WHERE employee_id = p_employee_id
  FOR UPDATE;
  
  -- If no tracker exists, create one
  IF v_tracker_id IS NULL THEN
    -- Generate ID for the new document if not provided
    IF p_document->>'id' IS NULL THEN
      p_document := jsonb_set(p_document, '{id}', to_jsonb(gen_random_uuid()::text));
    END IF;
    
    -- Add timestamps
    p_document := jsonb_set(p_document, '{created_at}', to_jsonb(NOW()::text));
    p_document := jsonb_set(p_document, '{updated_at}', to_jsonb(NOW()::text));
    
    INSERT INTO document_tracker (
      employee_id,
      branch_id,
      country,
      nationality_status,
      documents
    ) VALUES (
      p_employee_id,
      p_branch_id,
      p_country,
      p_nationality_status,
      jsonb_build_array(p_document)
    )
    RETURNING id INTO v_tracker_id;
    
    RETURN jsonb_build_object(
      'tracker_id', v_tracker_id,
      'document', p_document
    );
  END IF;
  
  -- Update existing tracker
  v_doc_id := p_document->>'id';
  
  -- If document has an ID, try to update existing document in array
  IF v_doc_id IS NOT NULL THEN
    v_updated_documents := '[]'::jsonb;
    
    -- Loop through documents and update the matching one
    FOR i IN 0..jsonb_array_length(v_documents) - 1 LOOP
      IF (v_documents->i)->>'id' = v_doc_id THEN
        -- Update timestamps on existing document
        p_document := jsonb_set(p_document, '{updated_at}', to_jsonb(NOW()::text));
        p_document := jsonb_set(
          p_document, 
          '{created_at}', 
          COALESCE(v_documents->i->'created_at', to_jsonb(NOW()::text))
        );
        v_updated_documents := v_updated_documents || jsonb_build_array(p_document);
        v_found := TRUE;
      ELSE
        v_updated_documents := v_updated_documents || jsonb_build_array(v_documents->i);
      END IF;
    END LOOP;
    
    -- If document wasn't found, add it as new
    IF NOT v_found THEN
      p_document := jsonb_set(p_document, '{created_at}', to_jsonb(NOW()::text));
      p_document := jsonb_set(p_document, '{updated_at}', to_jsonb(NOW()::text));
      v_updated_documents := COALESCE(v_documents, '[]'::jsonb) || jsonb_build_array(p_document);
    END IF;
  ELSE
    -- No ID provided, add as new document with generated ID
    p_document := jsonb_set(p_document, '{id}', to_jsonb(gen_random_uuid()::text));
    p_document := jsonb_set(p_document, '{created_at}', to_jsonb(NOW()::text));
    p_document := jsonb_set(p_document, '{updated_at}', to_jsonb(NOW()::text));
    v_updated_documents := COALESCE(v_documents, '[]'::jsonb) || jsonb_build_array(p_document);
  END IF;
  
  -- Update the tracker
  UPDATE document_tracker
  SET 
    documents = v_updated_documents,
    branch_id = COALESCE(p_branch_id, branch_id),
    country = COALESCE(p_country, country),
    nationality_status = COALESCE(p_nationality_status, nationality_status),
    updated_at = NOW()
  WHERE id = v_tracker_id;
  
  RETURN jsonb_build_object(
    'tracker_id', v_tracker_id,
    'document', p_document
  );
END;
$$;
