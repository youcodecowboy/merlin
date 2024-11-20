-- Drop and recreate inventory_items table with correct schema
DROP TABLE IF EXISTS inventory_items CASCADE;

CREATE TABLE inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    sku TEXT NOT NULL,
    status1 TEXT NOT NULL CHECK (status1 IN ('STOCK', 'PRODUCTION')),
    status2 TEXT NOT NULL CHECK (status2 IN ('COMMITTED', 'UNCOMMITTED')),
    qr_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_status1 ON inventory_items(status1);
CREATE INDEX idx_inventory_items_status2 ON inventory_items(status2);

-- Create trigger for updated_at
CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();