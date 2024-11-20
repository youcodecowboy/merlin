-- First, enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE production ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Products table policies
CREATE POLICY "Enable read access for authenticated users on products"
ON products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on products"
ON products FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on products"
ON products FOR UPDATE TO authenticated USING (true);

-- Customers table policies
CREATE POLICY "Enable read access for authenticated users on customers"
ON customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on customers"
ON customers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on customers"
ON customers FOR UPDATE TO authenticated USING (true);

-- Orders table policies
CREATE POLICY "Enable read access for authenticated users on orders"
ON orders FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on orders"
ON orders FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on orders"
ON orders FOR UPDATE TO authenticated USING (true);

-- Order items table policies
CREATE POLICY "Enable read access for authenticated users on order_items"
ON order_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on order_items"
ON order_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on order_items"
ON order_items FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users on order_items"
ON order_items FOR DELETE TO authenticated USING (true);

-- Pending production table policies
CREATE POLICY "Enable read access for authenticated users on pending_production"
ON pending_production FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on pending_production"
ON pending_production FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on pending_production"
ON pending_production FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users on pending_production"
ON pending_production FOR DELETE TO authenticated USING (true);

-- Batches table policies
CREATE POLICY "Enable read access for authenticated users on batches"
ON batches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on batches"
ON batches FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on batches"
ON batches FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users on batches"
ON batches FOR DELETE TO authenticated USING (true);

-- Production table policies
CREATE POLICY "Enable read access for authenticated users on production"
ON production FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on production"
ON production FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on production"
ON production FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users on production"
ON production FOR DELETE TO authenticated USING (true);

-- Inventory items table policies
CREATE POLICY "Enable read access for authenticated users on inventory_items"
ON inventory_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users on inventory_items"
ON inventory_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users on inventory_items"
ON inventory_items FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users on inventory_items"
ON inventory_items FOR DELETE TO authenticated USING (true);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant permissions for the update_updated_at_column function
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO authenticated;

-- Enable realtime subscriptions for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE pending_production;
ALTER PUBLICATION supabase_realtime ADD TABLE batches;
ALTER PUBLICATION supabase_realtime ADD TABLE production;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;

-- Enable row level security on the auth schema
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to update their own user data
CREATE POLICY "Users can update own user data"
ON auth.users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy to allow users to read all user data
CREATE POLICY "Users can read all user data"
ON auth.users
FOR SELECT TO authenticated
USING (true);

-- Grant access to auth schema
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA auth TO authenticated;
GRANT UPDATE ON auth.users TO authenticated;