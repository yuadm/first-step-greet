-- Add email configuration settings
INSERT INTO system_settings (setting_key, setting_value, description, created_at, updated_at)
VALUES (
  'email_settings',
  '{"sender_email": "noreply@yourcompany.com", "sender_name": "Your Company", "admin_email": "admin@yourcompany.com"}'::jsonb,
  'Email configuration settings for system emails',
  NOW(),
  NOW()
) ON CONFLICT (setting_key) DO NOTHING;

-- Create function to get email settings
CREATE OR REPLACE FUNCTION public.get_email_settings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_settings jsonb;
BEGIN
  SELECT setting_value INTO email_settings
  FROM system_settings 
  WHERE setting_key = 'email_settings'
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- Return default values if no settings found
  IF email_settings IS NULL THEN
    email_settings := '{"sender_email": "noreply@yourcompany.com", "sender_name": "Your Company", "admin_email": "admin@yourcompany.com"}'::jsonb;
  END IF;
  
  RETURN email_settings;
END;
$$;