-- Drop existing tables and constraints
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS production CASCADE;
DROP TYPE IF EXISTS batch_status CASCADE;
DROP TYPE IF EXISTS production_stage CASCADE;

-- Create enums
CREATE TYPE batch_status AS ENUM ('CREATED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE production_stage AS ENUM ('CUTTING', 'SEWING', 'WASHING', 'FINISHING', 'QC', 'READY');

-- Create batches table
CREATE TABLE batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    production_request_id UUID NOT NULL,
    batch_number SERIAL,
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
    status batch_status NOT NULL DEFAULT 'CREATED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT batches_production_request_id_fkey 
        FOREIGN KEY (production_request_id) 
        REFERENCES pending_production(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_batch_number UNIQUE (batch_number)
);

-- Create production table
CREATE TABLE production (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL,
    current_stage production_stage NOT NULL DEFAULT 'CUTTING',
    notes TEXT,
    batch_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT production_batch_id_fkey 
        FOREIGN KEY (batch_id) 
        REFERENCES batches(id) 
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_batches_production_request_id ON batches(production_request_id);
CREATE INDEX idx_production_batch_id ON production(batch_id);
CREATE INDEX idx_production_current_stage ON production(current_stage);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_updated_at
    BEFORE UPDATE ON production
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();