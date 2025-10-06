-- Add branch_id column to care_worker_statements table
ALTER TABLE care_worker_statements 
ADD COLUMN branch_id UUID REFERENCES branches(id);

-- Add index for better performance on branch filtering
CREATE INDEX idx_care_worker_statements_branch_id ON care_worker_statements(branch_id);