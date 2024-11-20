-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_name TEXT NOT NULL,
    request_description TEXT,
    assigned_to TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    deadline TIMESTAMP WITH TIME ZONE,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_priority ON requests(priority);
CREATE INDEX idx_requests_assigned_to ON requests(assigned_to);
CREATE INDEX idx_requests_inventory_item_id ON requests(inventory_item_id);
CREATE INDEX idx_requests_batch_id ON requests(batch_id);

-- Create trigger for updated_at
CREATE TRIGGER update_requests_updated_at
    BEFORE UPDATE ON requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Requests are viewable by authenticated users"
ON requests FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Requests can be created by authenticated users"
ON requests FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Requests can be updated by authenticated users"
ON requests FOR UPDATE
TO authenticated
USING (true);