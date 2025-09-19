-- Add a dedicated JSONB column to store structured form data
ALTER TABLE public.compliance_period_records
ADD COLUMN IF NOT EXISTS form_data jsonb;

-- Backfill existing Medication-Competency records: move JSON from notes -> form_data
UPDATE public.compliance_period_records
SET form_data = notes::jsonb
WHERE completion_method = 'medication_competency'
  AND notes IS NOT NULL
  AND trim(notes) LIKE '{%';

-- Clear notes for those Medication-Competency records so notes remains for plain text only
UPDATE public.compliance_period_records
SET notes = NULL
WHERE completion_method = 'medication_competency'
  AND notes IS NOT NULL
  AND trim(notes) LIKE '{%';

-- Optional: add a comment to document the purpose
COMMENT ON COLUMN public.compliance_period_records.form_data IS 'Structured form payload (e.g., medication competency). Notes should remain free-text.';