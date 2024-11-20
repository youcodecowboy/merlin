-- Add UUID column to pending_production if it doesn't exist
ALTER TABLE pending_production 
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();

-- Ensure UUID column is not null and unique
ALTER TABLE pending_production 
ALTER COLUMN uuid SET NOT NULL,
ADD CONSTRAINT pending_production_uuid_unique UNIQUE (uuid);

-- Update batches table to use BIGINT for production_request_id
ALTER TABLE batches 
DROP CONSTRAINT IF EXISTS batches_production_request_id_fkey,
ALTER COLUMN production_request_id TYPE BIGINT 
  USING (production_request_id::text::bigint);

-- Add foreign key constraint for BIGINT id
ALTER TABLE batches 
ADD CONSTRAINT batches_production_request_id_fkey 
FOREIGN KEY (production_request_id) 
REFERENCES pending_production(id) 
ON DELETE CASCADE;

-- Create index on UUID column
CREATE INDEX IF NOT EXISTS idx_pending_production_uuid 
ON pending_production(uuid);