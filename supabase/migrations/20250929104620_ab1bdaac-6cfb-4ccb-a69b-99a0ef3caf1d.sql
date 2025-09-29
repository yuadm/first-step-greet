-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule compliance automation to run daily at 1 AM UTC
-- This will handle all frequency types and status updates
SELECT cron.schedule(
  'compliance-automation-daily',
  '0 1 * * *', -- Daily at 1 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '", "type": "daily_automation"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule a weekly check on Mondays at 2 AM UTC for any missed periods
SELECT cron.schedule(
  'compliance-automation-weekly-check',
  '0 2 * * 1', -- Weekly on Monday at 2 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '", "type": "weekly_check"}')::jsonb
    ) as request_id;
  $$
);

-- Schedule monthly check on the 1st of each month at 3 AM UTC for period generation
SELECT cron.schedule(
  'compliance-automation-monthly',
  '0 3 1 * *', -- 1st of every month at 3 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://vfzyodedgtefvxcrqdtc.supabase.co/functions/v1/compliance-automation',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmenlvZGVkZ3RlZnZ4Y3JxZHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODM3MjcsImV4cCI6MjA2MzI1OTcyN30.pj0n5Sv_I24lgjdh7bq7565lBfks3tQE-NKnxmTn9Yg"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '", "type": "monthly_generation"}')::jsonb
    ) as request_id;
  $$
);

-- Create a function to check cron job status (without last_run column)
CREATE OR REPLACE FUNCTION get_compliance_automation_status()
RETURNS TABLE(job_name text, schedule text, active boolean)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    jobname::text as job_name,
    schedule::text,
    active
  FROM cron.job 
  WHERE jobname LIKE '%compliance-automation%'
  ORDER BY jobname;
$$;

-- Insert default automation settings if none exist
INSERT INTO compliance_automation_settings (
  auto_generate_records,
  grace_period_days,
  notification_days_before,
  escalation_days,
  auto_archive_completed
) 
SELECT 
  true,
  7,
  14,
  30,
  false
WHERE NOT EXISTS (SELECT 1 FROM compliance_automation_settings);

-- Update existing config to ensure automation is enabled
UPDATE compliance_automation_settings 
SET auto_generate_records = true
WHERE auto_generate_records = false;