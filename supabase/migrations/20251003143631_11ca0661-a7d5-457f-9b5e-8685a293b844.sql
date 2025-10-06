-- Ensure grace_period_end is set to period END for all active employee records
UPDATE compliance_period_records cpr
SET grace_period_end = get_period_end_date(ct.frequency, cpr.period_identifier)
FROM compliance_types ct
WHERE cpr.compliance_type_id = ct.id
  AND cpr.status IN ('pending','overdue','in_progress');

-- Ensure grace_period_end is set to period END for all active client records
UPDATE client_compliance_period_records ccpr
SET grace_period_end = get_period_end_date(cct.frequency, ccpr.period_identifier)
FROM client_compliance_types cct
WHERE ccpr.client_compliance_type_id = cct.id
  AND ccpr.status IN ('pending','overdue','in_progress');

-- Reset employee records that should no longer be overdue
UPDATE compliance_period_records
SET status = 'pending', is_overdue = false
WHERE status = 'overdue' AND grace_period_end >= CURRENT_DATE;

-- Reset client records that should no longer be overdue
UPDATE client_compliance_period_records
SET status = 'pending', is_overdue = false
WHERE status = 'overdue' AND grace_period_end >= CURRENT_DATE;