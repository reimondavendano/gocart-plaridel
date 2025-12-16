-- 1. Fix Foreign Key Relationship between order_items and orders
ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;

ALTER TABLE order_items
ADD CONSTRAINT order_items_order_id_fkey
FOREIGN KEY (order_id)
REFERENCES orders(id)
ON DELETE CASCADE;

-- 2. Ensure RLS Policies allow access
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "enable all order_items" ON order_items;
CREATE POLICY "enable all order_items" ON order_items FOR ALL TO public USING (true);

-- 3. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload config';
