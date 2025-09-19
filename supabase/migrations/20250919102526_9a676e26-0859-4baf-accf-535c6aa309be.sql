-- Remove duplicate category entries that don't have the required 'id' field in setting_value
DELETE FROM job_application_settings 
WHERE category = 'skills' 
  AND setting_type = 'category' 
  AND (setting_value->>'id') IS NULL;