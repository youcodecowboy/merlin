-- Drop and recreate products table
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drop and recreate inventory_items table
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
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_product_id ON inventory_items(product_id);
CREATE INDEX idx_inventory_items_status1 ON inventory_items(status1);
CREATE INDEX idx_inventory_items_status2 ON inventory_items(status2);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample products
INSERT INTO products (sku, name, description) VALUES
    ('ST-28-X-30-RAW', 'Standard Raw Denim', 'Standard fit raw denim jeans'),
    ('SL-32-S-32-BLK', 'Slim Black Denim', 'Slim fit black denim jeans'),
    ('RL-30-R-34-IND', 'Relaxed Indigo', 'Relaxed fit indigo denim jeans')
ON CONFLICT (sku) DO NOTHING;