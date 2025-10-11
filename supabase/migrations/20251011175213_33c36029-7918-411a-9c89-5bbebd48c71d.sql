-- Make time column nullable for client spot check records
-- Client spot checks don't require time tracking unlike employee spot checks
ALTER TABLE client_spot_check_records 
ALTER COLUMN time DROP NOT NULL;

-- Set default to NULL for clarity
ALTER TABLE client_spot_check_records 
ALTER COLUMN time SET DEFAULT NULL;