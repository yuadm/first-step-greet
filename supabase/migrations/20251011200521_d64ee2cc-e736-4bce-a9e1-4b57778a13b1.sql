-- Disable automatic compliance record generation
-- This prevents the system from automatically creating compliance records when new periods start

UPDATE compliance_automation_settings 
SET auto_generate_records = false
WHERE auto_generate_records = true;

-- If no settings exist yet, insert default settings with auto_generate disabled
INSERT INTO compliance_automation_settings (
  auto_generate_records,
  grace_period_days,
  notification_days_before,
  escalation_days,
  auto_archive_completed
)
SELECT 
  false,
  7,
  14,
  30,
  false
WHERE NOT EXISTS (SELECT 1 FROM compliance_automation_settings);