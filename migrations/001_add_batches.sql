-- Create enum type for batch status
CREATE TYPE batch_status AS ENUM ('CREATED', 'IN_PROGRESS', 'COMPLETED');

-- Create batches table
CREATE TABLE IF NOT EXISTS batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    production_request_id UUID REFERENCES pending_production(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    batch_number SERIAL,
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
    status batch_status NOT NULL DEFAULT 'CREATED',
    notes TEXT,
    CONSTRAINT unique_batch_number UNIQUE (batch_number)
);

-- Add batch_id to inventory_items
ALTER TABLE inventory_items
ADD COLUMN batch_id UUID REFERENCES batches(id) ON DELETE CASCADE;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for batches
CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_batches_production_request_id ON batches(production_request_id);
CREATE INDEX idx_inventory_items_batch_id ON inventory_items(batch_id);

-- Add batch-related functions
CREATE OR REPLACE FUNCTION create_batch(
    p_production_request_id UUID,
    p_total_quantity INTEGER,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_batch_id UUID;
BEGIN
    -- Verify production request exists
    IF NOT EXISTS (SELECT 1 FROM pending_production WHERE id = p_production_request_id) THEN
        RAISE EXCEPTION 'Production request with ID % not found', p_production_request_id;
    END IF;

    INSERT INTO batches (
        production_request_id,
        total_quantity,
        notes
    ) VALUES (
        p_production_request_id,
        p_total_quantity,
        p_notes
    )
    RETURNING id INTO v_batch_id;
    
    RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;