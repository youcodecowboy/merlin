-- Create inventory_events table
CREATE TABLE IF NOT EXISTS inventory_events (
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