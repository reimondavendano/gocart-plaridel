-- Migration to separate user-store messaging support

-- 1. Update conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- 2. Update messages sender_role check constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_role_check;
ALTER TABLE messages ADD CONSTRAINT messages_sender_role_check CHECK (sender_role IN ('user', 'admin', 'seller'));

-- 3. Update RLS policies if needed (already permissive in schema.sql but good to ensure)
-- Existing policies are FOR ALL TO public USING (true), so no change needed provided they apply to new columns.
