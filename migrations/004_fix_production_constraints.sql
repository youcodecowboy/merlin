-- Drop existing constraint
ALTER TABLE batches 
DROP CONSTRAINT IF EXISTS batches_production_request_id_fkey;

-- Fix the foreign key reference to point to pending_production instead of production_requests
ALTER TABLE batches 
ADD CONSTRAINT batches_production_request_id_fkey 
FOREIGN KEY (production_request_id) 
REFERENCES pending_production(id) 
ON DELETE CASCADE;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_pending_production_id ON pending_production(id);
CREATE INDEX IF NOT EXISTS idx_batches_production_request_id ON batches(production_request_id);