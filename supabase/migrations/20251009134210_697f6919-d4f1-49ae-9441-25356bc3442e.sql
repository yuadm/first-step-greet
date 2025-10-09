-- Add country column to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS country TEXT;

-- Migrate existing country data from documents to employees
-- Take the first non-null country value from each employee's documents
UPDATE employees e
SET country = (
  SELECT dt.country
  FROM document_tracker dt
  WHERE dt.employee_id = e.id
  AND dt.country IS NOT NULL
  LIMIT 1
)
WHERE e.country IS NULL;

-- Add comment
COMMENT ON COLUMN employees.country IS 'Employee country - applies to all their documents';