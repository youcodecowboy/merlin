-- Update pending_production table to use UUID for id
ALTER TABLE pending_production 
DROP CONSTRAINT IF EXISTS pending_production_pkey,
ALTER COLUMN id TYPE UUID USING uuid,
ALTER COLUMN id SET DEFAULT gen_random_uuid(),
ADD PRIMARY KEY (id);

-- Update batches table to use UUID for production_request_id
ALTER TABLE batches 
DROP CONSTRAINT IF EXISTS batches_production_request_id_fkey,
ALTER COLUMN production_request_id TYPE UUID 
  USING production_request_id::text::uuid;

-- Add foreign key constraint back
ALTER TABLE batches 
ADD CONSTRAINT batches_production_request_id_fkey 
FOREIGN KEY (production_request_id) 
REFERENCES pending_production(id) 
ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_production_id ON pending_production(id);
CREATE INDEX IF NOT EXISTS idx_batches_production_request_id ON batches(production_request_id);