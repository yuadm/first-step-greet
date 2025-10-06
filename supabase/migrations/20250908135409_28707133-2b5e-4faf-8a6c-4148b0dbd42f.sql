-- Update care worker statements to use the assigned employee's branch
UPDATE care_worker_statements 
SET branch_id = employees.branch_id
FROM employees 
WHERE care_worker_statements.assigned_employee_id = employees.id
AND care_worker_statements.branch_id IS NULL;