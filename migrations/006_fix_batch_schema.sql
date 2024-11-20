-- Drop existing tables and constraints
DROP TABLE IF EXISTS production CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS pending_production CASCADE;
DROP TYPE IF EXISTS batch_status CASCADE;
DROP TYPE IF EXISTS production_stage CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;
DROP TYPE IF EXISTS production_status CASCADE;

-- Create enums
CREATE TYPE batch_status AS ENUM ('CREATED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE production_stage AS ENUM ('CUTTING', 'SEWING', 'WASHING', 'FINISHING', 'QC', 'READY');
CREATE TYPE priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE production_status AS ENUM ('PENDING', 'ACCEPTED');

-- Create pending_production table
CREATE TABLE pending_production (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    priority priority_level NOT NULL DEFAULT 'LOW',
    notes TEXT,
    status production_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create batches table
CREATE TABLE batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pending_request_id UUID NOT NULL REFERENCES pending_production(id) ON DELETE CASCADE,
    batch_number SERIAL,
    total_quantity INTEGER NOT NULL CHECK (total_quantity > 0),
    status batch_status NOT NULL DEFAULT 'CREATED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_batch_number UNIQUE (batch_number)
);

-- Create production table
CREATE TABLE production (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL,
    current_stage production_stage NOT NULL DEFAULT 'CUTTING',
    notes TEXT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_pending_production_status ON pending_production(status);
CREATE INDEX idx_batches_pending_request_id ON batches(pending_request_id);
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

CREATE TRIGGER update_pending_production_updated_at
    BEFORE UPDATE ON pending_production
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_updated_at
    BEFORE UPDATE ON production
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();