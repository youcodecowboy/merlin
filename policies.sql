-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE production ENABLE ROW LEVEL SECURITY;

-- Products table policies
CREATE POLICY "Products are viewable by authenticated users"
ON products FOR SELECT
TO authenticated
USING (true);

-- Inventory items policies
CREATE POLICY "Inventory items are viewable by authenticated users"
ON inventory_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Inventory items can be created by authenticated users"
ON inventory_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Inventory items can be updated by authenticated users"
ON inventory_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Inventory items can be deleted by authenticated users"
ON inventory_items FOR DELETE
TO authenticated
USING (true);

-- Orders policies
CREATE POLICY "Orders are viewable by authenticated users"
ON orders FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Orders can be created by authenticated users"
ON orders FOR INSERT
TO authenticated
WITH CHECK (true);

-- Order items policies
CREATE POLICY "Order items are viewable by authenticated users"
ON order_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Order items can be created by authenticated users"
ON order_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- Customers policies
CREATE POLICY "Customers are viewable by authenticated users"
ON customers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Customers can be created by authenticated users"
ON customers FOR INSERT
TO authenticated
WITH CHECK (true);

-- Batches policies
CREATE POLICY "Batches are viewable by authenticated users"
ON batches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Batches can be created by authenticated users"
ON batches FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Batches can be updated by authenticated users"
ON batches FOR UPDATE
TO authenticated
USING (true);

-- Pending production policies
CREATE POLICY "Pending production requests are viewable by authenticated users"
ON pending_production FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Pending production requests can be created by authenticated users"
ON pending_production FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Pending production requests can be updated by authenticated users"
ON pending_production FOR UPDATE
TO authenticated
USING (true);

-- Production policies
CREATE POLICY "Production items are viewable by authenticated users"
ON production FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Production items can be created by authenticated users"
ON production FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Production items can be updated by authenticated users"
ON production FOR UPDATE
TO authenticated
USING (true);

-- Enable authenticated users to use RLS
CREATE POLICY "Enable all operations for authenticated users" ON auth.users
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);