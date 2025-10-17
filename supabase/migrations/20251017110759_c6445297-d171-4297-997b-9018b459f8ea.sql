-- Phase 1: Add JSONB column and indexes
ALTER TABLE document_tracker 
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::JSONB;

-- Add GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_document_tracker_documents_gin 
ON document_tracker USING GIN (documents);

-- Phase 2: Create migration function to populate JSONB
CREATE OR REPLACE FUNCTION migrate_documents_to_jsonb()
RETURNS INTEGER AS $$
DECLARE
  employee_record RECORD;
  document_record RECORD;
  documents_array JSONB;
  rows_processed INTEGER := 0;
BEGIN
  -- For each unique employee
  FOR employee_record IN 
    SELECT DISTINCT employee_id, country, nationality_status, branch_id
    FROM document_tracker
    ORDER BY employee_id
  LOOP
    documents_array := '[]'::JSONB;
    
    -- Collect all documents for this employee
    FOR document_record IN 
      SELECT id, document_type_id, document_number, issue_date, 
             expiry_date, status, notes, created_at, updated_at
      FROM document_tracker
      WHERE employee_id = employee_record.employee_id
      ORDER BY created_at
    LOOP
      documents_array := documents_array || jsonb_build_object(
        'id', document_record.id,
        'document_type_id', document_record.document_type_id,
        'document_number', document_record.document_number,
        'issue_date', document_record.issue_date,
        'expiry_date', document_record.expiry_date,
        'status', document_record.status,
        'notes', document_record.notes,
        'created_at', document_record.created_at,
        'updated_at', document_record.updated_at
      );
    END LOOP;
    
    -- Keep the first row for this employee, update it with the JSONB array
    UPDATE document_tracker
    SET documents = documents_array
    WHERE id = (
      SELECT id FROM document_tracker
      WHERE employee_id = employee_record.employee_id
      ORDER BY created_at
      LIMIT 1
    );
    
    rows_processed := rows_processed + 1;
  END LOOP;
  
  RETURN rows_processed;
END;
$$ LANGUAGE plpgsql;

-- Phase 3: Execute migration
SELECT migrate_documents_to_jsonb();

-- Delete duplicate rows using CTE and ROW_NUMBER
WITH ranked_docs AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY created_at) as rn
  FROM document_tracker
)
DELETE FROM document_tracker
WHERE id IN (SELECT id FROM ranked_docs WHERE rn > 1);

-- Add unique constraint
ALTER TABLE document_tracker 
ADD CONSTRAINT document_tracker_employee_id_key UNIQUE (employee_id);

-- Phase 4: Create helper functions for CRUD operations
CREATE OR REPLACE FUNCTION upsert_employee_document(
  p_employee_id UUID,
  p_document JSONB,
  p_country VARCHAR DEFAULT NULL,
  p_nationality_status VARCHAR DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  existing_docs JSONB;
  doc_index INT;
  result JSONB;
  new_doc_id UUID;
BEGIN
  -- Generate new ID if not provided
  IF p_document->>'id' IS NULL THEN
    new_doc_id := gen_random_uuid();
    p_document := jsonb_set(p_document, '{id}', to_jsonb(new_doc_id::text));
  END IF;
  
  -- Set timestamps
  p_document := jsonb_set(p_document, '{updated_at}', to_jsonb(NOW()::text));
  IF p_document->>'created_at' IS NULL THEN
    p_document := jsonb_set(p_document, '{created_at}', to_jsonb(NOW()::text));
  END IF;
  
  -- Check if employee tracker exists
  SELECT documents INTO existing_docs
  FROM document_tracker
  WHERE employee_id = p_employee_id;
  
  IF existing_docs IS NULL THEN
    -- Create new tracker
    INSERT INTO document_tracker (employee_id, documents, country, nationality_status, branch_id)
    VALUES (p_employee_id, jsonb_build_array(p_document), p_country, p_nationality_status, p_branch_id)
    RETURNING jsonb_build_object('success', true, 'document', p_document) INTO result;
  ELSE
    -- Find if document already exists by ID
    doc_index := -1;
    IF p_document->>'id' IS NOT NULL THEN
      FOR i IN 0..jsonb_array_length(existing_docs) - 1 LOOP
        IF (existing_docs->i->>'id') = (p_document->>'id') THEN
          doc_index := i;
          EXIT;
        END IF;
      END LOOP;
    END IF;
    
    IF doc_index >= 0 THEN
      -- Update existing document
      existing_docs := jsonb_set(existing_docs, ARRAY[doc_index::text], p_document);
    ELSE
      -- Append new document
      existing_docs := existing_docs || p_document;
    END IF;
    
    -- Update tracker
    UPDATE document_tracker
    SET documents = existing_docs,
        country = COALESCE(p_country, country),
        nationality_status = COALESCE(p_nationality_status, nationality_status),
        branch_id = COALESCE(p_branch_id, branch_id),
        updated_at = NOW()
    WHERE employee_id = p_employee_id
    RETURNING jsonb_build_object('success', true, 'document', p_document) INTO result;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete a document
CREATE OR REPLACE FUNCTION delete_employee_document(
  p_employee_id UUID,
  p_document_id UUID
)
RETURNS JSONB AS $$
DECLARE
  existing_docs JSONB;
  new_docs JSONB;
BEGIN
  SELECT documents INTO existing_docs
  FROM document_tracker
  WHERE employee_id = p_employee_id;
  
  IF existing_docs IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Employee tracker not found');
  END IF;
  
  -- Filter out the document to delete
  SELECT jsonb_agg(doc)
  INTO new_docs
  FROM jsonb_array_elements(existing_docs) doc
  WHERE (doc->>'id')::UUID != p_document_id;
  
  IF new_docs IS NULL OR jsonb_array_length(new_docs) = 0 THEN
    -- Delete entire row if no documents remain
    DELETE FROM document_tracker WHERE employee_id = p_employee_id;
    RETURN jsonb_build_object('success', true, 'deleted_tracker', true);
  ELSE
    -- Update with remaining documents
    UPDATE document_tracker
    SET documents = new_docs, updated_at = NOW()
    WHERE employee_id = p_employee_id;
    RETURN jsonb_build_object('success', true, 'deleted_tracker', false);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_tracker_employee_id 
ON document_tracker(employee_id);

CREATE INDEX IF NOT EXISTS idx_document_tracker_branch_id 
ON document_tracker(branch_id);

CREATE INDEX IF NOT EXISTS idx_document_tracker_country 
ON document_tracker(country);