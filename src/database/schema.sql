-- GoCart Plaridel Multi-Vendor E-Commerce Database Schema
-- Database: Supabase (PostgreSQL)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('seller', 'customer');

DROP TYPE IF EXISTS store_status CASCADE;
CREATE TYPE store_status AS ENUM ('pending', 'approved', 'rejected');

DROP TYPE IF EXISTS order_status CASCADE;
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned', 'refunded');

DROP TYPE IF EXISTS payment_method CASCADE;
CREATE TYPE payment_method AS ENUM ('cod', 'xendit');

DROP TYPE IF EXISTS payment_status CASCADE;
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

DROP TYPE IF EXISTS discount_type CASCADE;
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- =====================================================
-- DROP TABLES IF EXISTS
-- =====================================================
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS deals CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE; -- New table
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS barangays CASCADE; -- New table
DROP TABLE IF EXISTS cities CASCADE; -- New table
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS admin_credentials CASCADE;
DROP TABLE IF EXISTS user_credentials CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;

-- =====================================================
-- PLANS TABLE
-- =====================================================
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'PHP',
    features JSONB,
    max_stores INTEGER DEFAULT 1,
    max_products INTEGER DEFAULT 10,
    transaction_fee DECIMAL(4, 2) DEFAULT 0, -- percentage
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CITIES TABLE
-- =====================================================
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    province VARCHAR(100) DEFAULT 'Bulacan',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BARANGAYS TABLE
-- =====================================================
CREATE TABLE barangays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADMINS TABLE (includes profile data)
-- =====================================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar TEXT,
    role VARCHAR(50) DEFAULT 'super_admin',
    password_hash TEXT NOT NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    address_id UUID, -- Will be set after addresses table is created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VERIFY ADMIN PASSWORD FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION verify_admin_password(admin_email TEXT, password_attempt TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT password_hash INTO stored_hash FROM admins WHERE email = admin_email;
    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN stored_hash = crypt(password_attempt, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- USERS TABLE (Auth only)
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'customer',
    password_hash TEXT, -- Nullable for OAuth users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- VERIFY USER PASSWORD FUNCTION (for sellers/customers)
-- =====================================================
CREATE OR REPLACE FUNCTION verify_user_password(user_email TEXT, password_attempt TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    stored_hash TEXT;
BEGIN
    SELECT password_hash INTO stored_hash FROM users WHERE email = user_email;
    IF stored_hash IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN stored_hash = crypt(password_attempt, stored_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ADDRESSES TABLE (Normalized)
-- =====================================================
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) DEFAULT 'Home',
    complete_address VARCHAR(255) NOT NULL,
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    barangay_id UUID REFERENCES barangays(id) ON DELETE SET NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- USER_PROFILES TABLE (Profile Info)
-- =====================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar TEXT,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL, -- Main/Default address reference
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STORES TABLE
-- =====================================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo TEXT,
    banner TEXT,
    status store_status DEFAULT 'pending',
    -- Verification Documents
    valid_id_front TEXT,
    valid_id_back TEXT,
    business_permit TEXT,
    selfie_image TEXT,
    -- Geolocation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    -- Admin Verification
    verification_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    -- Stats
    rating DECIMAL(2, 1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CATEGORIES TABLE
-- =====================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(50),
    image TEXT,
    description TEXT,
    product_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    compare_price DECIMAL(10, 2),
    images TEXT[],
    stock INTEGER DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    rating DECIMAL(2, 1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    ai_generated BOOLEAN DEFAULT false,
    is_disabled BOOLEAN DEFAULT false,
    is_disabled_by_admin BOOLEAN DEFAULT false,
    disabled_by_admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COUPONS TABLE
-- =====================================================
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type discount_type NOT NULL,
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2),
    usage_limit INTEGER DEFAULT 0,
    used_count INTEGER DEFAULT 0,
    for_plus_only BOOLEAN DEFAULT false,
    for_new_users BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_fee DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    payment_method payment_method,
    payment_status payment_status DEFAULT 'pending',
    shipping_address_id UUID REFERENCES addresses(id),
    coupon_code VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    product_image TEXT,
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL
);

-- =====================================================
-- REVIEWS TABLE
-- =====================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- DEALS TABLE
-- =====================================================
DROP TYPE IF EXISTS deal_type CASCADE;
CREATE TYPE deal_type AS ENUM ('flash_sale', 'clearance', 'seasonal', 'bundle', 'special');

CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deal_type deal_type DEFAULT 'flash_sale',
    discount_type discount_type NOT NULL DEFAULT 'percentage',
    discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    is_active BOOLEAN DEFAULT true,
    show_on_landing BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0, -- Higher priority shows first
    created_by UUID REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deals_product_id ON deals(product_id);
CREATE INDEX idx_deals_active ON deals(is_active, show_on_landing);
CREATE INDEX idx_deals_dates ON deals(start_date, end_date);

-- =====================================================
-- CONVERSATIONS & MESSAGES (Support)
-- =====================================================
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL, 
    sender_role TEXT NOT NULL CHECK (sender_role IN ('user', 'admin', 'seller')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables (ALL operations, public access)
CREATE POLICY "enable all plans" ON plans FOR ALL TO public USING (true);
CREATE POLICY "enable all cities" ON cities FOR ALL TO public USING (true);
CREATE POLICY "enable all barangays" ON barangays FOR ALL TO public USING (true);
CREATE POLICY "enable all admins" ON admins FOR ALL TO public USING (true);
CREATE POLICY "enable all users" ON users FOR ALL TO public USING (true);
CREATE POLICY "enable all addresses" ON addresses FOR ALL TO public USING (true);
CREATE POLICY "enable all user_profiles" ON user_profiles FOR ALL TO public USING (true);
CREATE POLICY "enable all stores" ON stores FOR ALL TO public USING (true);
CREATE POLICY "enable all categories" ON categories FOR ALL TO public USING (true);
CREATE POLICY "enable all products" ON products FOR ALL TO public USING (true);
CREATE POLICY "enable all coupons" ON coupons FOR ALL TO public USING (true);
CREATE POLICY "enable all orders" ON orders FOR ALL TO public USING (true);
CREATE POLICY "enable all order_items" ON order_items FOR ALL TO public USING (true);
CREATE POLICY "enable all reviews" ON reviews FOR ALL TO public USING (true);
CREATE POLICY "enable all conversations" ON conversations FOR ALL TO public USING (true);
CREATE POLICY "enable all messages" ON messages FOR ALL TO public USING (true);
CREATE POLICY "enable all deals" ON deals FOR ALL TO public USING (true);

-- =====================================================
-- SEED DATA
-- =====================================================

-- 0. Insert Plans
INSERT INTO plans (id, name, price, features, max_stores, max_products, transaction_fee) VALUES
('11111111-1111-1111-1111-111111111111', 'Starter', 0, '["Create 1 Store (Verification Required)", "Upload up to 1 Product", "Basic Store Analytics", "Standard Transaction Fees (3%)", "Community Support"]', 1, 1, 3.0),
('22222222-2222-2222-2222-222222222222', 'Growth', 199, '["Create 1 Store (Verification Required)", "Upload up to 50 Products", "Advanced Analytics Dashboard", "Reduced Transaction Fees (2%)", "\"Verified Seller\" Badge", "Priority Email Support"]', 1, 50, 2.0),
('33333333-3333-3333-3333-333333333333', 'Pro', 499, '["Create up to 2 Stores", "Upload up to 500 Products", "Professional Analytics & Reports", "Low Transaction Fees (1%)", "Marketing Tools", "\"Pro Seller\" Badge", "24/7 Priority Support"]', 2, 500, 1.0),
('44444444-4444-4444-4444-444444444444', 'Enterprise', 999, '["Unlimited Stores", "Unlimited Product Uploads", "Custom Analytics & API Access", "Lowest Transaction Fees (0.5%)", "Dedicated Account Manager", "Top Search Ranking", "Early Access to New Features"]', 9999, 9999, 0.5);

-- 1. Insert Cities
INSERT INTO cities (id, name, is_active) VALUES
('11111111-aaaa-bbbb-cccc-111111111111', 'Plaridel', 'True'),
('22222222-aaaa-bbbb-cccc-222222222222', 'Bustos', 'True'),
('33333333-aaaa-bbbb-cccc-333333333333', 'Pulilan', 'True');

-- 2. Insert Barangays (Complete list)
INSERT INTO barangays (id, city_id, name, is_active) VALUES
-- Bustos Barangays (14)
('b0000001-2222-3333-4444-b00000000001', '22222222-aaaa-bbbb-cccc-222222222222', 'Bonga Mayor', 'True'),
('b0000002-2222-3333-4444-b00000000002', '22222222-aaaa-bbbb-cccc-222222222222', 'Bonga Menor', 'True'),
('b0000003-2222-3333-4444-b00000000003', '22222222-aaaa-bbbb-cccc-222222222222', 'Buisan', 'True'),
('b0000004-2222-3333-4444-b00000000004', '22222222-aaaa-bbbb-cccc-222222222222', 'Camachilihan', 'True'),
('b0000005-2222-3333-4444-b00000000005', '22222222-aaaa-bbbb-cccc-222222222222', 'Cambaog', 'True'),
('b0000006-2222-3333-4444-b00000000006', '22222222-aaaa-bbbb-cccc-222222222222', 'Catacte', 'True'),
('b0000007-2222-3333-4444-b00000000007', '22222222-aaaa-bbbb-cccc-222222222222', 'Liciada', 'True'),
('b0000008-2222-3333-4444-b00000000008', '22222222-aaaa-bbbb-cccc-222222222222', 'Malamig', 'True'),
('b0000009-2222-3333-4444-b00000000009', '22222222-aaaa-bbbb-cccc-222222222222', ' Malawak', 'True'),
('b0000010-2222-3333-4444-b00000000010', '22222222-aaaa-bbbb-cccc-222222222222', 'Poblacion', 'True'),
('b0000011-2222-3333-4444-b00000000011', '22222222-aaaa-bbbb-cccc-222222222222', 'San Pedro', 'True'),
('b0000012-2222-3333-4444-b00000000012', '22222222-aaaa-bbbb-cccc-222222222222', 'Talampas', 'True'),
('b0000013-2222-3333-4444-b00000000013', '22222222-aaaa-bbbb-cccc-222222222222', 'Tanawan', 'True'),
('b0000014-2222-3333-4444-b00000000014', '22222222-aaaa-bbbb-cccc-222222222222', 'Tibagan', 'True'),

-- Plaridel Barangays (19)
('a0000001-1111-2222-3333-a00000000001', '11111111-aaaa-bbbb-cccc-111111111111', 'Agnaya', 'True'),
('a0000002-1111-2222-3333-a00000000002', '11111111-aaaa-bbbb-cccc-111111111111', 'Bagong Silang', 'True'),
('a0000003-1111-2222-3333-a00000000003', '11111111-aaaa-bbbb-cccc-111111111111', 'Banga I', 'True'),
('a0000004-1111-2222-3333-a00000000004', '11111111-aaaa-bbbb-cccc-111111111111', 'Banga II', 'True'),
('a0000005-1111-2222-3333-a00000000005', '11111111-aaaa-bbbb-cccc-111111111111', 'Bintog', 'True'),
('a0000006-1111-2222-3333-a00000000006', '11111111-aaaa-bbbb-cccc-111111111111', 'Bulihan', 'True'),
('a0000007-1111-2222-3333-a00000000007', '11111111-aaaa-bbbb-cccc-111111111111', 'Culianin', 'True'),
('a0000008-1111-2222-3333-a00000000008', '11111111-aaaa-bbbb-cccc-111111111111', 'Dampol', 'True'),
('a0000009-1111-2222-3333-a00000000009', '11111111-aaaa-bbbb-cccc-111111111111', 'Lagundi', 'True'),
('a0000010-1111-2222-3333-a00000000010', '11111111-aaaa-bbbb-cccc-111111111111', 'Lalangan', 'True'),
('a0000011-1111-2222-3333-a00000000011', '11111111-aaaa-bbbb-cccc-111111111111', 'Lumang Bayan', 'True'),
('a0000012-1111-2222-3333-a00000000012', '11111111-aaaa-bbbb-cccc-111111111111', 'Parulan', 'True'),
('a0000013-1111-2222-3333-a00000000013', '11111111-aaaa-bbbb-cccc-111111111111', 'Poblacion', 'True'),
('a0000014-1111-2222-3333-a00000000014', '11111111-aaaa-bbbb-cccc-111111111111', 'Rueda', 'True'),
('a0000015-1111-2222-3333-a00000000015', '11111111-aaaa-bbbb-cccc-111111111111', 'San Jose', 'True'),
('a0000016-1111-2222-3333-a00000000016', '11111111-aaaa-bbbb-cccc-111111111111', 'Santa Ines', 'True'),
('a0000017-1111-2222-3333-a00000000017', '11111111-aaaa-bbbb-cccc-111111111111', 'Santo Niño', 'True'),
('a0000018-1111-2222-3333-a00000000018', '11111111-aaaa-bbbb-cccc-111111111111', 'Sipat', 'True'),
('a0000019-1111-2222-3333-a00000000019', '11111111-aaaa-bbbb-cccc-111111111111', 'Tabang', 'True'),

-- Pulilan Barangays (19)
('c0000001-3333-4444-5555-c00000000001', '33333333-aaaa-bbbb-cccc-333333333333', 'Balatong A', 'True'),
('c0000002-3333-4444-5555-c00000000002', '33333333-aaaa-bbbb-cccc-333333333333', 'Balatong B', 'True'),
('c0000003-3333-4444-5555-c00000000003', '33333333-aaaa-bbbb-cccc-333333333333', 'Cutcot', 'True'),
('c0000004-3333-4444-5555-c00000000004', '33333333-aaaa-bbbb-cccc-333333333333', 'Dampol I', 'True'),
('c0000005-3333-4444-5555-c00000000005', '33333333-aaaa-bbbb-cccc-333333333333', 'Dampol II-A', 'True'),
('c0000006-3333-4444-5555-c00000000006', '33333333-aaaa-bbbb-cccc-333333333333', 'Dampol II-B', 'True'),
('c0000007-3333-4444-5555-c00000000007', '33333333-aaaa-bbbb-cccc-333333333333', 'Dulong Malabon', 'True'),
('c0000008-3333-4444-5555-c00000000008', '33333333-aaaa-bbbb-cccc-333333333333', 'Inaon', 'True'),
('c0000009-3333-4444-5555-c00000000009', '33333333-aaaa-bbbb-cccc-333333333333', 'Longos', 'True'),
('c0000010-3333-4444-5555-c00000000010', '33333333-aaaa-bbbb-cccc-333333333333', 'Lumbac', 'True'),
('c0000011-3333-4444-5555-c00000000011', '33333333-aaaa-bbbb-cccc-333333333333', 'Paltao', 'True'),
('c0000012-3333-4444-5555-c00000000012', '33333333-aaaa-bbbb-cccc-333333333333', 'Penabatan', 'True'),
('c0000013-3333-4444-5555-c00000000013', '33333333-aaaa-bbbb-cccc-333333333333', 'Poblacion', 'True'),
('c0000014-3333-4444-5555-c00000000014', '33333333-aaaa-bbbb-cccc-333333333333', 'Santa Peregrina', 'True'),
('c0000015-3333-4444-5555-c00000000015', '33333333-aaaa-bbbb-cccc-333333333333', 'Santo Cristo', 'True'),
('c0000016-3333-4444-5555-c00000000016', '33333333-aaaa-bbbb-cccc-333333333333', 'Taal', 'True'),
('c0000017-3333-4444-5555-c00000000017', '33333333-aaaa-bbbb-cccc-333333333333', 'Tabon', 'True'),
('c0000018-3333-4444-5555-c00000000018', '33333333-aaaa-bbbb-cccc-333333333333', 'Tibag', 'True'),
('c0000019-3333-4444-5555-c00000000019', '33333333-aaaa-bbbb-cccc-333333333333', 'Tinejero', 'True');

-- 3. Insert Admins
INSERT INTO admins (id, email, name, avatar, role, password_hash) VALUES
('d440c9f0-c555-4422-b111-c99002200333', 'admingocartplaridel@gmail.com', 'GoCart Admin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 'super_admin', crypt('admin@goCartPlaridel66212', gen_salt('bf')));

-- 4. Insert Users (Auth info only)
INSERT INTO users (id, email, role, password_hash, created_at, updated_at) VALUES
('28546792-7f28-4448-9da4-722630560980', 'seller@gocart.ph', 'seller', crypt('seller123', gen_salt('bf')), '2024-02-15T00:00:00Z', '2024-12-01T00:00:00Z'),
('b1932330-8111-460b-9366-077558667500', 'fashionhub@seller.com', 'seller', crypt('seller123', gen_salt('bf')), '2024-03-10T00:00:00Z', '2024-12-01T00:00:00Z'),
('c3894760-9222-571c-a477-188669778611', 'home@seller.com', 'seller', crypt('seller123', gen_salt('bf')), '2024-04-20T00:00:00Z', '2024-12-01T00:00:00Z'),
('d4905871-0333-682d-b588-299770889722', 'beauty@seller.com', 'seller', crypt('seller123', gen_salt('bf')), '2024-01-10T00:00:00Z', '2024-12-01T00:00:00Z'),
('e5016982-1444-793e-c699-300881990833', 'sports@seller.com', 'seller', crypt('seller123', gen_salt('bf')), '2024-05-05T00:00:00Z', '2024-12-01T00:00:00Z'),
('f6127093-2555-8a4f-d700-411992001944', 'books@seller.com', 'seller', crypt('seller123', gen_salt('bf')), '2024-02-28T00:00:00Z', '2024-12-01T00:00:00Z'),
('072381a4-3666-9b50-e811-522003112055', 'gadgets@seller.com', 'seller', crypt('seller123', gen_salt('bf')), '2024-06-15T00:00:00Z', '2024-12-01T00:00:00Z'),
('183492b5-4777-ac61-f922-633114223166', 'market@seller.com', 'seller', crypt('seller123', gen_salt('bf')), '2024-03-25T00:00:00Z', '2024-12-01T00:00:00Z'),
('396504a6-5888-bd72-0033-744225334277', 'john.doe@email.com', 'customer', crypt('seller123', gen_salt('bf')), '2024-04-01T00:00:00Z', '2024-12-01T00:00:00Z'),
('4a7615b7-6999-ce83-1144-855336445388', 'jane.smith@email.com', 'customer', crypt('seller123', gen_salt('bf')), '2024-05-15T00:00:00Z', '2024-12-01T00:00:00Z');

-- 5. Insert Addresses (Normalized)
-- Assigning barangays from Plaridel, Bustos, and Pulilan
INSERT INTO addresses (id, user_id, label, complete_address, city_id, barangay_id, latitude, longitude, is_default) VALUES
('5b8726c8-7000-df94-2255-966447556499', '396504a6-5888-bd72-0033-744225334277', 'Home', 'St. Mark, Maliban Village', '11111111-aaaa-bbbb-cccc-111111111111', 'a0000013-1111-2222-3333-a00000000013', 14.8872, 120.8576, true),
('6c9837d9-8111-e0a5-3366-a775586675aa', '396504a6-5888-bd72-0033-744225334277', 'Office', 'St. Mark, Maliban Village', '11111111-aaaa-bbbb-cccc-111111111111', 'a0000006-1111-2222-3333-a00000000006', 14.8885, 120.8604, false),
('7d0948ea-9222-f1b6-4477-b886697786bb', '28546792-7f28-4448-9da4-722630560980', 'Store', 'St. Mark, Maliban Village', '11111111-aaaa-bbbb-cccc-111111111111', 'a0000001-1111-2222-3333-a00000000001', 14.8890, 120.8610, true),
('8e1a59fb-a333-02c7-5588-c997708897cc', 'b1932330-8111-460b-9366-077558667500', 'Store', 'St. Mark, Maliban Village', '11111111-aaaa-bbbb-cccc-111111111111', 'a0000019-1111-2222-3333-a00000000019', 14.8900, 120.8570, true),
('9f2b600c-b444-13d8-6699-daa8819908dd', 'c3894760-9222-571c-a477-188669778611', 'Store', 'St. Mark, Maliban Village', '11111111-aaaa-bbbb-cccc-111111111111', 'b0000010-2222-3333-4444-b00000000010', 14.8850, 120.8640, true),
('a03c711d-c555-24e9-7700-ebb9920019ee', 'd4905871-0333-682d-b588-299770889722', 'Store', 'St. Mark, Maliban Village', '11111111-aaaa-bbbb-cccc-111111111111', 'b0000001-2222-3333-4444-b00000000001', 14.8860, 120.8630, true),
('b14d822e-d666-35fa-8811-fcc0031120ff', 'e5016982-1444-793e-c699-300881990833', 'Store', 'St. Mark, Maliban Village', '11111111-aaaa-bbbb-cccc-111111111111', 'c0000013-3333-4444-5555-c00000000013', 14.8895, 120.8580, true),
('c25e933f-e777-460b-9922-0dd114223100', 'f6127093-2555-8a4f-d700-411992001944', 'Store', 'St. Mark, Maliban Village', '11111111-aaaa-bbbb-cccc-111111111111', 'c0000003-3333-4444-5555-c00000000003', 14.8870, 120.8590, true),
('d36fa440-f888-571c-aa33-1ee225334211', '072381a4-3666-9b50-e811-522003112055', 'Store', 'St. Mark, Maliban Village', '11111111-aaaa-bbbb-cccc-111111111111', 'a0000009-1111-2222-3333-a00000000009', 14.8880, 120.8620, true),
('e470b551-0999-682d-bb44-2ff336445322', '183492b5-4777-ac61-f922-633114223166', 'Store', 'St. Mark, Maliban Village', '11111111-aaaa-bbbb-cccc-111111111111', 'a0000012-1111-2222-3333-a00000000012', 14.8885, 120.8604, true);

-- 6. Insert User Profiles
INSERT INTO user_profiles (user_id, name, phone, avatar, plan_id, address_id) VALUES
('28546792-7f28-4448-9da4-722630560980', 'TechZone Store', '+63 918 234 5678', 'https://api.dicebear.com/7.x/avataaars/svg?seed=techzone', '33333333-3333-3333-3333-333333333333', '7d0948ea-9222-f1b6-4477-b886697786bb'),
('b1932330-8111-460b-9366-077558667500', 'Fashion Hub', '+63 919 345 6789', 'https://api.dicebear.com/7.x/avataaars/svg?seed=fashion', '11111111-1111-1111-1111-111111111111', '8e1a59fb-a333-02c7-5588-c997708897cc'),
('c3894760-9222-571c-a477-188669778611', 'Home Essentials', '+63 922 123 4567', 'https://api.dicebear.com/7.x/avataaars/svg?seed=home', '22222222-2222-2222-2222-222222222222', '9f2b600c-b444-13d8-6699-daa8819908dd'),
('d4905871-0333-682d-b588-299770889722', 'Beauty Bliss', '+63 923 234 5678', 'https://api.dicebear.com/7.x/avataaars/svg?seed=beauty', '33333333-3333-3333-3333-333333333333', 'a03c711d-c555-24e9-7700-ebb9920019ee'),
('e5016982-1444-793e-c699-300881990833', 'Sports Central', '+63 924 345 6789', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sports', '11111111-1111-1111-1111-111111111111', 'b14d822e-d666-35fa-8811-fcc0031120ff'),
('f6127093-2555-8a4f-d700-411992001944', 'Bookworm Haven', '+63 925 456 7890', 'https://api.dicebear.com/7.x/avataaars/svg?seed=books', '22222222-2222-2222-2222-222222222222', 'c25e933f-e777-460b-9922-0dd114223100'),
('072381a4-3666-9b50-e811-522003112055', 'Gadget Galaxy', '+63 926 567 8901', 'https://api.dicebear.com/7.x/avataaars/svg?seed=gadgets', '11111111-1111-1111-1111-111111111111', 'd36fa440-f888-571c-aa33-1ee225334211'),
('183492b5-4777-ac61-f922-633114223166', 'Fresh Market', '+63 927 678 9012', 'https://api.dicebear.com/7.x/avataaars/svg?seed=market', '33333333-3333-3333-3333-333333333333', 'e470b551-0999-682d-bb44-2ff336445322'),
('396504a6-5888-bd72-0033-744225334277', 'John Doe', '+63 920 456 7890', 'https://api.dicebear.com/7.x/avataaars/svg?seed=john', '44444444-4444-4444-4444-444444444444', '5b8726c8-7000-df94-2255-966447556499'),
('4a7615b7-6999-ce83-1144-855336445388', 'Jane Smith', '+63 921 567 8901', 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane', '11111111-1111-1111-1111-111111111111', NULL);

-- 7. Insert Stores
INSERT INTO stores (id, seller_id, name, slug, description, logo, banner, address_id, status, valid_id_front, valid_id_back, business_permit, selfie_image, latitude, longitude, verification_notes, verified_at, verified_by, rating, total_reviews, total_products, total_sales, created_at, updated_at) VALUES
('f581c662-1aaa-793e-cc55-300447556433', '28546792-7f28-4448-9da4-722630560980', 'TechZone Electronics', 'techzone-electronics', 'Your one-stop shop for premium electronics and gadgets.', 'https://api.dicebear.com/7.x/identicon/svg?seed=techzone', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200', '7d0948ea-9222-f1b6-4477-b886697786bb', 'approved', 'https://example.com/id_front.jpg', 'https://example.com/id_back.jpg', 'https://example.com/permit.jpg', 'https://example.com/selfie.jpg', 14.8885, 120.8604, 'Verified seller', '2024-02-15T10:00:00Z', 'd440c9f0-c555-4422-b111-c99002200333', 4.8, 256, 48, 1250,  '2024-02-15T00:00:00Z', '2024-12-01T00:00:00Z'),
('0692d773-2bbb-8a4f-dd66-411558667544', 'b1932330-8111-460b-9366-077558667500', 'Fashion Hub Philippines', 'fashion-hub-ph', 'Trendy and affordable fashion for everyone.', 'https://api.dicebear.com/7.x/identicon/svg?seed=fashionhub', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200', '8e1a59fb-a333-02c7-5588-c997708897cc', 'approved', 'https://example.com/id_front.jpg', 'https://example.com/id_back.jpg', 'https://example.com/permit.jpg', 'https://example.com/selfie.jpg', 14.8890, 120.8610, 'Verified manual check', '2024-03-10T11:00:00Z', 'd440c9f0-c555-4422-b111-c99002200333', 4.6, 189, 124, 890,  '2024-03-10T00:00:00Z', '2024-12-01T00:00:00Z'),
('17a3e884-3ccc-9b50-ee77-522669778655', 'c3894760-9222-571c-a477-188669778611', 'Home Essentials Co.', 'home-essentials', 'Quality home and living products to make your house a home.', 'https://api.dicebear.com/7.x/identicon/svg?seed=homeessentials', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200', '9f2b600c-b444-13d8-6699-daa8819908dd', 'approved', 'https://example.com/id_front.jpg', 'https://example.com/id_back.jpg', 'https://example.com/permit.jpg', 'https://example.com/selfie.jpg', 14.8870, 120.8590, 'All docs valid', '2024-04-20T14:30:00Z', 'd440c9f0-c555-4422-b111-c99002200333', 4.5, 145, 67, 520,  '2024-04-20T00:00:00Z', '2024-12-01T00:00:00Z'),
('28b4f995-4ddd-ac61-ff88-633770889766', 'd4905871-0333-682d-b588-299770889722', 'Beauty Bliss PH', 'beauty-bliss-ph', 'Premium skincare and cosmetics.', 'https://api.dicebear.com/7.x/identicon/svg?seed=beautybliss', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200', 'a03c711d-c555-24e9-7700-ebb9920019ee', 'approved', 'https://example.com/id_front.jpg', 'https://example.com/id_back.jpg', 'https://example.com/permit.jpg', 'https://example.com/selfie.jpg', 14.8880, 120.8620, 'System verification', '2024-01-10T09:00:00Z', 'd440c9f0-c555-4422-b111-c99002200333', 4.9, 312, 89, 1560,  '2024-01-10T00:00:00Z', '2024-12-01T00:00:00Z'),
('39c50aa6-5eee-bd72-0099-744881990877', 'e5016982-1444-793e-c699-300881990833', 'Sports Central', 'sports-central', 'Everything you need for your active lifestyle.', 'https://api.dicebear.com/7.x/identicon/svg?seed=sportscentral', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200', 'b14d822e-d666-35fa-8811-fcc0031120ff', 'approved', 'https://example.com/id_front.jpg', 'https://example.com/id_back.jpg', 'https://example.com/permit.jpg', 'https://example.com/selfie.jpg', 14.8895, 120.8580, 'Approved', '2024-05-05T16:00:00Z', 'd440c9f0-c555-4422-b111-c99002200333', 4.7, 178, 56, 780,  '2024-05-05T00:00:00Z', '2024-12-01T00:00:00Z'),
('4ad61bb7-6fff-ce83-11aa-855992001988', 'f6127093-2555-8a4f-d700-411992001944', 'Bookworm Haven', 'bookworm-haven', 'Books, stationery, and everything for readers.', 'https://api.dicebear.com/7.x/identicon/svg?seed=bookworm', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200', 'c25e933f-e777-460b-9922-0dd114223100', 'approved', 'https://example.com/id_front.jpg', 'https://example.com/id_back.jpg', 'https://example.com/permit.jpg', 'https://example.com/selfie.jpg', 14.8860, 120.8630, 'Verified', '2024-02-28T13:00:00Z', 'd440c9f0-c555-4422-b111-c99002200333', 4.8, 234, 143, 920,  '2024-02-28T00:00:00Z', '2024-12-01T00:00:00Z'),
('5be72cc8-7000-df94-22bb-966003112099', '072381a4-3666-9b50-e811-522003112055', 'Gadget Galaxy', 'gadget-galaxy', 'Latest gadgets at unbeatable prices.', 'https://api.dicebear.com/7.x/identicon/svg?seed=gadgetgalaxy', 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200', 'd36fa440-f888-571c-aa33-1ee225334211', 'approved', 'https://example.com/id_front.jpg', 'https://example.com/id_back.jpg', 'https://example.com/permit.jpg', 'https://example.com/selfie.jpg', 14.8900, 120.8570, 'Checked', '2024-06-15T10:00:00Z', 'd440c9f0-c555-4422-b111-c99002200333', 4.4, 98, 34, 340,  '2024-06-15T00:00:00Z', '2024-12-01T00:00:00Z'),
('6cf83dd9-8111-e0a5-33cc-a771142231aa', '183492b5-4777-ac61-f922-633114223166', 'Plaridel Fresh Market', 'plaridel-fresh-market', 'Fresh produce delivered to your doorstep.', 'https://api.dicebear.com/7.x/identicon/svg?seed=freshmarket', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200', 'e470b551-0999-682d-bb44-2ff336445322', 'approved', 'https://example.com/id_front.jpg', 'https://example.com/id_back.jpg', 'https://example.com/permit.jpg', 'https://example.com/selfie.jpg', 14.8850, 120.8640, 'Verified seller', '2024-03-25T09:00:00Z', 'd440c9f0-c555-4422-b111-c99002200333', 4.6, 156, 78, 680,  '2024-03-25T00:00:00Z', '2024-12-01T00:00:00Z');

-- 8. Insert Categories
INSERT INTO categories (id, name, slug, icon, image, description, product_count) VALUES
('7d094ee0-9222-f1b6-44dd-b882253342bb', 'Electronics', 'electronics', 'Smartphone', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800', 'Gadgets and devices', 156),
('8e1a5ff1-a333-02c7-55ee-c993364453cc', 'Fashion', 'fashion', 'Shirt', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800', 'Clothing and accessories', 324),
('9f2b6002-b444-13d8-66ff-daa4475564dd', 'Home & Living', 'home-living', 'Home', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800', 'Furniture and decor', 89),
('a03c7113-c555-24e9-7700-ebb5586675ee', 'Beauty', 'beauty', 'Sparkles', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', 'Skincare and cosmetics', 201),
('b14d8224-d666-35fa-8811-fcc6697786ff', 'Sports', 'sports', 'Dumbbell', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 'Fitness and outdoor', 67),
('c25e9335-e777-460b-9922-0dd770889700', 'Books', 'books', 'BookOpen', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800', 'Books and stationery', 143);

-- 9. Insert Products
INSERT INTO products (id, store_id, category_id, name, slug, description, price, compare_price, images, stock, in_stock, rating, review_count, tags, is_featured, is_new, ai_generated, created_at, updated_at) VALUES
('d36fa446-f888-571c-aa33-1ee881990811', 'f581c662-1aaa-793e-cc55-300447556433', '7d094ee0-9222-f1b6-44dd-b882253342bb', 'Premium Wireless Headphones Pro X', 'premium-wireless-headphones-pro-x', 'Experience crystal-clear audio with our flagship wireless headphones.', 4999, 6999, ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800'], 50, true, 4.9, 128, ARRAY['headphones', 'wireless', 'audio', 'premium'], true, true, false, '2024-10-01T00:00:00Z', '2024-12-01T00:00:00Z'),
('e470b557-0999-682d-bb44-2ff992001922', 'f581c662-1aaa-793e-cc55-300447556433', '7d094ee0-9222-f1b6-44dd-b882253342bb', 'Smart Watch Series 5', 'smart-watch-series-5', 'Stay connected and track your fitness with our advanced smartwatch.', 8999, 10999, ARRAY['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'], 35, true, 4.7, 89, ARRAY['smartwatch', 'fitness', 'wearable'], true, false, false, '2024-09-15T00:00:00Z', '2024-12-01T00:00:00Z'),
('f581c668-1aaa-793e-cc55-300003112033', '0692d773-2bbb-8a4f-dd66-411558667544', '8e1a5ff1-a333-02c7-55ee-c993364453cc', 'Classic Leather Jacket - Brown', 'classic-leather-jacket-brown', 'Timeless style meets modern comfort.', 3499, NULL, ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'], 25, true, 4.5, 45, ARRAY['jacket', 'leather', 'men', 'fashion'], true, false, false, '2024-08-20T00:00:00Z', '2024-12-01T00:00:00Z'),
('0692d779-2bbb-8a4f-dd66-411114223144', '0692d773-2bbb-8a4f-dd66-411558667544', '8e1a5ff1-a333-02c7-55ee-c993364453cc', 'Designer Handbag Collection', 'designer-handbag-collection', 'Elegant designer handbag crafted from premium materials.', 2999, 3999, ARRAY['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'], 15, true, 4.8, 67, ARRAY['handbag', 'designer', 'women', 'accessories'], false, true, false, '2024-11-01T00:00:00Z', '2024-12-01T00:00:00Z'),
('17a3e880-3ccc-9b50-ee77-522225334255', 'f581c662-1aaa-793e-cc55-300447556433', '7d094ee0-9222-f1b6-44dd-b882253342bb', 'Portable Bluetooth Speaker', 'portable-bluetooth-speaker', '360 immersive sound with deep bass.', 1999, NULL, ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'], 100, true, 4.6, 234, ARRAY['speaker', 'bluetooth', 'portable', 'audio'], false, false, false, '2024-07-10T00:00:00Z', '2024-12-01T00:00:00Z'),
('28b4f991-4ddd-ac61-ff88-633336445366', 'f581c662-1aaa-793e-cc55-300447556433', '7d094ee0-9222-f1b6-44dd-b882253342bb', 'Mechanical Gaming Keyboard RGB', 'mechanical-gaming-keyboard-rgb', 'Professional gaming keyboard with Cherry MX switches.', 5499, NULL, ARRAY['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800'], 40, true, 4.9, 156, ARRAY['keyboard', 'gaming', 'mechanical', 'rgb'], true, true, true, '2024-11-15T00:00:00Z', '2024-12-01T00:00:00Z');

-- 10. Insert Coupons
INSERT INTO coupons (id, code, description, discount_type, discount_value, min_purchase, max_discount, usage_limit, used_count, for_plus_only, for_new_users, expires_at, is_active, created_at) VALUES
('39c50aa2-5eee-bd72-0099-744447556477', 'WELCOME10', '10% off for new users', 'percentage', 10, 500, 500, 1000, 234, false, true, '2025-01-31T23:59:59Z', true, '2024-01-01T00:00:00Z'),
('4ad61bb3-6fff-ce83-11aa-855558667588', 'PLUS20', '20% off for Plus members', 'percentage', 20, 1000, 1000, 500, 89, true, false, '2025-06-30T23:59:59Z', true, '2024-06-01T00:00:00Z'),
('5be72cc4-7000-df94-22bb-966003112099', 'FREESHIP', 'Free shipping on orders over 2000', 'fixed', 150, 2000, NULL, 2000, 567, false, false, '2025-03-31T23:59:59Z', true, '2024-03-01T00:00:00Z');
