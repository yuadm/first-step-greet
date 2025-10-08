-- Fix client_spot_check_records where compliance_record_id incorrectly points to itself
-- This updates records to link them to the correct client_compliance_period_records

UPDATE client_spot_check_records csr
SET compliance_record_id = ccpr.id
FROM client_compliance_period_records ccpr
WHERE csr.compliance_record_id = csr.id
  AND csr.client_id = ccpr.client_id
  AND csr.date >= get_period_end_date(
    (SELECT frequency FROM client_compliance_types WHERE id = ccpr.client_compliance_type_id),
    ccpr.period_identifier
  ) - INTERVAL '3 months'
  AND csr.date <= get_period_end_date(
    (SELECT frequency FROM client_compliance_types WHERE id = ccpr.client_compliance_type_id),
    ccpr.period_identifier
  );