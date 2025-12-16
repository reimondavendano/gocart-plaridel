-- =====================================================
-- ORDER MANAGEMENT SYSTEM - SCHEMA UPDATES
-- Run this AFTER the main schema.sql
-- This script adds new tables and columns for order management
-- =====================================================

-- =====================================================
-- NOTE: order_status enum is defined in schema.sql
-- The simplified statuses are:
--   'pending'    - Order placed, awaiting seller approval or payment
--   'processing' - Seller approved, preparing order
--   'shipped'    - Out for delivery
--   'delivered'  - Arrived at customer
--   'completed'  - Customer confirmed receipt
--   'cancelled'  - Order cancelled
--   'refunded'   - Refund processed
-- =====================================================

-- 1. Add 'expired' to payment_status if not exists (safe approach)
-- Note: ALTER TYPE ADD VALUE is not transactional, run separately if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'expired' AND enumtypid = 'payment_status'::regtype) THEN
        ALTER TYPE payment_status ADD VALUE 'expired';
    END IF;
EXCEPTION WHEN others THEN
    NULL; -- Ignore if already exists or other issues
END $$;

-- =====================================================
-- 2. ADD NEW COLUMNS TO PRODUCTS TABLE
-- =====================================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sold_stock INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- =====================================================
-- 3. ADD NEW COLUMNS TO ORDERS TABLE
-- =====================================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS seller_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS xendit_invoice_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS xendit_invoice_url TEXT,
ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- 4. DROP AND RECREATE NEW TABLES
-- =====================================================
DROP TABLE IF EXISTS stock_reservations CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS refund_requests CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- =====================================================
-- 5. STOCK RESERVATIONS TABLE
-- =====================================================
CREATE TABLE stock_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'confirmed', 'released', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reservations_expires ON stock_reservations(expires_at, status);
CREATE INDEX idx_reservations_order ON stock_reservations(order_id);

-- =====================================================
-- 6. ORDER STATUS HISTORY TABLE (AUDIT TRAIL)
-- =====================================================
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID,
    changed_by_role VARCHAR(20) CHECK (changed_by_role IN ('customer', 'seller', 'admin', 'system')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_history ON order_status_history(order_id, created_at DESC);

-- =====================================================
-- 7. COUPON USAGE TRACKING TABLE
-- =====================================================
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    discount_applied DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, user_id)
);

-- =====================================================
-- 8. PAYMENT TRANSACTIONS LOG TABLE
-- =====================================================
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(20) NOT NULL,
    xendit_invoice_id VARCHAR(255),
    xendit_payment_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'expired', 'refunded')),
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(10, 2),
    webhook_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX idx_payment_xendit ON payment_transactions(xendit_invoice_id);

-- =====================================================
-- 9. REFUND REQUESTS TABLE
-- =====================================================
CREATE TABLE refund_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    images TEXT[],
    requested_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    admin_notes TEXT,
    processed_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_refund_requests_order ON refund_requests(order_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(status);

-- =====================================================
-- 10. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- =====================================================
-- 11. ENABLE ROW LEVEL SECURITY ON NEW TABLES
-- =====================================================
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. CREATE PERMISSIVE POLICIES FOR ALL TABLES
-- =====================================================
CREATE POLICY "enable all stock_reservations" ON stock_reservations FOR ALL TO public USING (true);
CREATE POLICY "enable all order_status_history" ON order_status_history FOR ALL TO public USING (true);
CREATE POLICY "enable all coupon_usage" ON coupon_usage FOR ALL TO public USING (true);
CREATE POLICY "enable all payment_transactions" ON payment_transactions FOR ALL TO public USING (true);
CREATE POLICY "enable all refund_requests" ON refund_requests FOR ALL TO public USING (true);
CREATE POLICY "enable all refund_requests" ON refund_requests FOR ALL TO public USING (true);
CREATE POLICY "enable all notifications" ON notifications FOR ALL TO public USING (true);
CREATE POLICY "enable all orders" ON orders FOR ALL TO public USING (true);

-- =====================================================
-- 13. INDEXES FOR ORDERS TABLE (PERFORMANCE)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_store_status ON orders(store_id, status);

-- =====================================================
-- 14. HELPER FUNCTIONS FOR STOCK MANAGEMENT
-- =====================================================

-- Function to increment coupon usage count
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE coupons SET used_count = used_count + 1 WHERE id = p_coupon_id;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm stock reservation (move from reserved to sold)
CREATE OR REPLACE FUNCTION confirm_stock_reservation(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE products 
    SET 
        stock = stock - p_quantity,
        reserved_stock = GREATEST(0, reserved_stock - p_quantity),
        sold_stock = sold_stock + p_quantity
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Function to release stock reservation
CREATE OR REPLACE FUNCTION release_stock_reservation(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE products 
    SET reserved_stock = GREATEST(0, reserved_stock - p_quantity)
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;
