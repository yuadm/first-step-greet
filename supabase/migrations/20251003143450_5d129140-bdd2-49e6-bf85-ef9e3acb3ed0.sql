-- Reset status for employee compliance records that are no longer overdue
UPDATE compliance_period_records
SET 
  status = 'pending',
  is_overdue = false
WHERE status = 'overdue' 
AND grace_period_end >= CURRENT_DATE;

-- Reset status for client compliance records that are no longer overdue
UPDATE client_compliance_period_records
SET 
  status = 'overdue',
  is_overdue = false
WHERE status = 'overdue' 
AND grace_period_end >= CURRENT_DATE;