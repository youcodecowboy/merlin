-- Add product_id column to inventory_items
ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Create index for product_id
CREATE INDEX IF NOT EXISTS idx_inventory_items_product_id ON inventory_items(product_id);