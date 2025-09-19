-- Create unified job application settings table
CREATE TABLE public.job_application_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'emergency', 'personal', 'shift', 'skills', 'status', 'steps', 'fields', 'reference', 'positions'
  setting_type TEXT, -- specific type within category
  setting_key TEXT NOT NULL, -- unique identifier for the setting
  setting_value JSONB NOT NULL DEFAULT '{}'::jsonb, -- stores all the data flexibly
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_application_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for job application settings
CREATE POLICY "Admins can manage job application settings" 
ON public.job_application_settings 
FOR ALL 
USING (is_admin_user()) 
WITH CHECK (is_admin_user());

CREATE POLICY "Public can view active job application settings" 
ON public.job_application_settings 
FOR SELECT 
USING (is_active = true);

-- Create index for better performance
CREATE INDEX idx_job_application_settings_category ON public.job_application_settings(category);
CREATE INDEX idx_job_application_settings_type ON public.job_application_settings(setting_type);
CREATE INDEX idx_job_application_settings_key ON public.job_application_settings(setting_key);

-- Create function to migrate data from existing tables
CREATE OR REPLACE FUNCTION migrate_application_settings_data()
RETURNS INTEGER AS $$
DECLARE
  migrated_count INTEGER := 0;
  record_count INTEGER;
BEGIN
  -- Migrate emergency settings
  INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
  SELECT 
    'emergency' as category,
    setting_type,
    setting_type || '_' || value as setting_key,
    jsonb_build_object(
      'value', value,
      'display_order', display_order,
      'is_active', is_active
    ) as setting_value,
    display_order,
    is_active,
    created_at,
    updated_at
  FROM application_emergency_settings;
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  migrated_count := migrated_count + record_count;

  -- Migrate personal settings
  INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
  SELECT 
    'personal' as category,
    setting_type,
    setting_type || '_' || value as setting_key,
    jsonb_build_object(
      'value', value,
      'display_order', display_order,
      'is_active', is_active
    ) as setting_value,
    display_order,
    is_active,
    created_at,
    updated_at
  FROM application_personal_settings;
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  migrated_count := migrated_count + record_count;

  -- Migrate shift settings
  INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
  SELECT 
    'shift' as category,
    'shift' as setting_type,
    name as setting_key,
    jsonb_build_object(
      'name', name,
      'label', label,
      'start_time', start_time,
      'end_time', end_time,
      'display_order', display_order,
      'is_active', is_active
    ) as setting_value,
    display_order,
    is_active,
    created_at,
    updated_at
  FROM application_shift_settings;
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  migrated_count := migrated_count + record_count;

  -- Migrate skills
  INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
  SELECT 
    'skills' as category,
    'skill' as setting_type,
    name as setting_key,
    jsonb_build_object(
      'name', name,
      'category_id', category_id,
      'display_order', display_order,
      'is_active', is_active
    ) as setting_value,
    display_order,
    is_active,
    created_at,
    updated_at
  FROM application_skills;
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  migrated_count := migrated_count + record_count;

  -- Migrate skills categories
  INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
  SELECT 
    'skills' as category,
    'category' as setting_type,
    name as setting_key,
    jsonb_build_object(
      'name', name,
      'description', description,
      'display_order', display_order,
      'is_active', is_active
    ) as setting_value,
    display_order,
    is_active,
    created_at,
    updated_at
  FROM application_skills_categories;
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  migrated_count := migrated_count + record_count;

  -- Migrate status settings
  INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
  SELECT 
    'status' as category,
    'status' as setting_type,
    status_name as setting_key,
    jsonb_build_object(
      'status_name', status_name,
      'status_label', status_label,
      'status_color', status_color,
      'is_default', is_default,
      'display_order', display_order,
      'is_active', is_active
    ) as setting_value,
    display_order,
    is_active,
    created_at,
    updated_at
  FROM application_status_settings;
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  migrated_count := migrated_count + record_count;

  -- Migrate step settings
  INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
  SELECT 
    'steps' as category,
    'step' as setting_type,
    step_name as setting_key,
    jsonb_build_object(
      'step_name', step_name,
      'display_name', display_name,
      'description', description,
      'is_enabled', is_enabled,
      'is_required', is_required,
      'step_config', step_config,
      'display_order', display_order
    ) as setting_value,
    display_order,
    is_enabled as is_active,
    created_at,
    updated_at
  FROM application_step_settings;
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  migrated_count := migrated_count + record_count;

  -- Migrate field settings
  INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
  SELECT 
    'fields' as category,
    step_name as setting_type,
    field_name as setting_key,
    jsonb_build_object(
      'step_name', step_name,
      'field_name', field_name,
      'field_label', field_label,
      'is_visible', is_visible,
      'is_required', is_required,
      'validation_rules', validation_rules,
      'help_text', help_text,
      'display_order', display_order
    ) as setting_value,
    display_order,
    is_visible as is_active,
    created_at,
    updated_at
  FROM application_field_settings;
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  migrated_count := migrated_count + record_count;

  -- Migrate reference settings
  INSERT INTO job_application_settings (category, setting_type, setting_key, setting_value, display_order, is_active, created_at, updated_at)
  SELECT 
    'reference' as category,
    setting_key as setting_type,
    setting_key as setting_key,
    setting_value as setting_value,
    0 as display_order,
    true as is_active,
    created_at,
    updated_at
  FROM application_reference_settings;
  
  GET DIAGNOSTICS record_count = ROW_COUNT;
  migrated_count := migrated_count + record_count;

  RETURN migrated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the migration
SELECT migrate_application_settings_data();

-- Add trigger for updated_at
CREATE TRIGGER update_job_application_settings_updated_at
BEFORE UPDATE ON public.job_application_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();