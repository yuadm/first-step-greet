-- Clean up compliance records where employee was created after the period
-- This removes records that shouldn't exist based on employee creation date

DELETE FROM compliance_period_records cpr
WHERE NOT EXISTS (
  SELECT 1 FROM employees e
  WHERE e.id = cpr.employee_id
  AND e.created_at::date <= get_period_end_date(
    (SELECT frequency FROM compliance_types WHERE id = cpr.compliance_type_id),
    cpr.period_identifier
  )
);

-- Clean up client compliance records where client was created after the period
DELETE FROM client_compliance_period_records ccpr
WHERE NOT EXISTS (
  SELECT 1 FROM clients c
  WHERE c.id = ccpr.client_id
  AND c.created_at::date <= get_period_end_date(
    (SELECT frequency FROM client_compliance_types WHERE id = ccpr.client_compliance_type_id),
    ccpr.period_identifier
  )
);