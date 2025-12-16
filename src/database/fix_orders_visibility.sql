-- Fix visibility for Orders and Order Items
-- Run this in Supabase SQL Editor

-- 1. Orders Table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable all orders" ON orders;
CREATE POLICY "enable all orders" ON orders FOR ALL TO public USING (true);

-- 2. Order Items Table
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable all order_items" ON order_items;
CREATE POLICY "enable all order_items" ON order_items FOR ALL TO public USING (true);

-- 3. Products Table (just in case)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable all products" ON products;
CREATE POLICY "enable all products" ON products FOR ALL TO public USING (true);

-- 4. Stores Table
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "enable all stores" ON stores;
CREATE POLICY "enable all stores" ON stores FOR ALL TO public USING (true);
