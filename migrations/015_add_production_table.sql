-- Create production table if it doesn't exist
CREATE TABLE IF NOT EXISTS production (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL,
    current_stage TEXT NOT NULL CHECK (current_stage IN ('CUTTING', 'SEWING', 'WASHING', 'FINISHING', 'QC', 'READY')),
    notes TEXT,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_production_batch_id ON production(batch_id);
CREATE INDEX IF NOT EXISTS idx_production_current_stage ON production(current_stage);
CREATE INDEX IF NOT EXISTS idx_production_sku ON production(sku);

-- Create trigger for updated_at
CREATE TRIGGER update_production_updated_at
    BEFORE UPDATE ON production
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();