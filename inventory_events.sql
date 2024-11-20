-- Create inventory_events table
CREATE TABLE IF NOT EXISTS inventory_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_description TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_inventory_events_item_id ON inventory_events(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_events_status ON inventory_events(status);
CREATE INDEX IF NOT EXISTS idx_inventory_events_timestamp ON inventory_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_inventory_events_metadata ON inventory_events USING gin(metadata);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_events_updated_at
    BEFORE UPDATE ON inventory_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE inventory_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users on inventory_events"
    ON inventory_events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users on inventory_events"
    ON inventory_events FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on inventory_events"
    ON inventory_events FOR UPDATE
    TO authenticated
    USING (true);

-- Insert some sample events
INSERT INTO inventory_events (
    inventory_item_id,
    event_name,
    event_description,
    status,
    timestamp,
    metadata
)
SELECT 
    id as inventory_item_id,
    'Item Created' as event_name,
    'Inventory item was created in the system' as event_description,
    'COMPLETED' as status,
    created_at as timestamp,
    jsonb_build_object(
        'sku', sku,
        'status1', status1,
        'status2', status2
    ) as metadata
FROM inventory_items
WHERE created_at >= NOW() - INTERVAL '24 hours'
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON inventory_events TO authenticated;
GRANT USAGE ON SEQUENCE inventory_events_id_seq TO authenticated;