-- Create pending_production table if it doesn't exist
CREATE TABLE IF NOT EXISTS pending_production (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_production_sku ON pending_production(sku);
CREATE INDEX IF NOT EXISTS idx_pending_production_status ON pending_production(status);
CREATE INDEX IF NOT EXISTS idx_pending_production_priority ON pending_production(priority);

-- Create trigger for updated_at
CREATE TRIGGER update_pending_production_updated_at
    BEFORE UPDATE ON pending_production
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();