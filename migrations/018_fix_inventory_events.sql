-- Drop existing table if it exists
DROP TABLE IF EXISTS inventory_events CASCADE;

-- Create inventory_events table
CREATE TABLE inventory_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_description TEXT,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED')),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_inventory_events_item_id ON inventory_events(inventory_item_id);
CREATE INDEX idx_inventory_events_status ON inventory_events(status);
CREATE INDEX idx_inventory_events_timestamp ON inventory_events(timestamp);

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_events_updated_at
    BEFORE UPDATE ON inventory_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE inventory_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users on inventory_events"
ON inventory_events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on inventory_events"
ON inventory_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on inventory_events"
ON inventory_events FOR UPDATE TO authenticated USING (true);

-- Insert some sample events for testing
INSERT INTO inventory_events (
    inventory_item_id,
    event_name,
    event_description,
    status,
    timestamp
)
SELECT 
    id as inventory_item_id,
    'Item Created' as event_name,
    'Inventory item was created' as event_description,
    'COMPLETED' as status,
    created_at as timestamp
FROM inventory_items
WHERE created_at >= NOW() - INTERVAL '24 hours';