-- Remove duplicate skills by keeping only the ones with proper IDs in setting_value
WITH duplicate_skills AS (
  SELECT 
    id,
    setting_value->>'name' as skill_name,
    ROW_NUMBER() OVER (PARTITION BY setting_value->>'name' ORDER BY 
      CASE WHEN setting_value->>'id' IS NOT NULL THEN 1 ELSE 2 END,
      created_at ASC
    ) as rn
  FROM job_application_settings 
  WHERE category = 'skills' 
    AND setting_type = 'skill'
)
DELETE FROM job_application_settings 
WHERE id IN (
  SELECT id 
  FROM duplicate_skills 
  WHERE rn > 1
);