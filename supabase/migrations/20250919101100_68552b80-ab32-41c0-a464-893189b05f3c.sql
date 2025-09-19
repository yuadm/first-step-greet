-- Migrate skills categories to job_application_settings
INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
SELECT 
  'skills' as category,
  'category' as setting_type,
  'category_' || name as setting_key,
  jsonb_build_object(
    'id', id,
    'name', name,
    'description', description,
    'display_order', display_order,
    'is_active', is_active
  ) as setting_value,
  display_order,
  is_active,
  created_at,
  updated_at
FROM application_skills_categories
WHERE is_active = true;

-- Migrate skills to job_application_settings
INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
SELECT 
  'skills' as category,
  'skill' as setting_type,
  'skill_' || name as setting_key,
  jsonb_build_object(
    'id', id,
    'name', name,
    'category_id', category_id,
    'display_order', display_order,
    'is_active', is_active
  ) as setting_value,
  display_order,
  is_active,
  created_at,
  updated_at
FROM application_skills
WHERE is_active = true;