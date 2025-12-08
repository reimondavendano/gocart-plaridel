-- GoCart Plaridel Multi-Vendor E-Commerce Database Schema
-- Database: Supabase (PostgreSQL)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================
CREATE TYPE user_role AS ENUM ('seller', 'customer');
CREATE TYPE subscription_plan AS ENUM ('free', 'plus');
CREATE TYPE store_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned', 'refunded');
CREATE TYPE payment_method AS ENUM ('cod', 'xendit');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- =====================================================
-- ADMIN TABLES
-- =====================================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'super_admin',
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE admin_credentials (
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_creds_email ON admin_credentials(email);

-- =====================================================
-- USER TABLES
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    avatar TEXT,
    role user_role DEFAULT 'customer',
    subscription subscription_plan DEFAULT 'free',
    phone VARCHAR(50),
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    is_new_user BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);

CREATE TABLE user_credentials (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    clerk_id VARCHAR(255) UNIQUE, 
    last_login TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_creds_email ON user_credentials(email);

-- =====================================================
-- ADDRESSES TABLE (Shared for Users and Stores)
-- =====================================================
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50), -- e.g. 'Home', 'Office', 'Store Location'
    full_name VARCHAR(255),
    phone VARCHAR(50),
    street TEXT,
    city VARCHAR(100),
    province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Philippines',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- =====================================================
-- STORES TABLE
-- =====================================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_id UUID REFERENCES addresses(id) ON DELETE SET NULL, -- Linked Address
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    logo TEXT,
    banner TEXT,
    status store_status DEFAULT 'pending',
    rating DECIMAL(2, 1) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_products INTEGER DEFAULT 0,
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_stores_seller ON stores(seller_id);
CREATE INDEX idx_stores_status ON stores(status);

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
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    product_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_slug VARCHAR(100) REFERENCES categories(slug),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    compare_price DECIMAL(10, 2),
    images TEXT[],
    stock INTEGER DEFAULT 0,
    is_stock BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    rating DECIMAL(2, 1) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_new BOOLEAN DEFAULT false,
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REVIEWS, WISHLIST, ORDERS, ETC.
-- =====================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    images TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE wishlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10, 2) NOT NULL,
    shipping_fee DECIMAL(10, 2) DEFAULT 0,
    discount DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    payment_method payment_method,
    payment_status payment_status DEFAULT 'pending',
    shipping_address_id UUID REFERENCES addresses(id),
    coupon_code VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    name VARCHAR(255),
    image VARCHAR(255),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL
);

-- =====================================================
-- SEED DATA
-- =====================================================

-- 1. Insert Categories
INSERT INTO categories (name, slug, icon, image, description) VALUES
('Electronics', 'electronics', 'Smartphone', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800', 'Gadgets and tech'),
('Fashion', 'fashion', 'Shirt', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800', 'Clothing and apparel'),
('Home & Living', 'home-living', 'Home', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800', 'Furniture and decor'),
('Beauty', 'beauty', 'Sparkles', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', 'Skincare'),
('Sports', 'sports', 'Dumbbell', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', 'Fitness');

-- 2. Insert Admin
WITH new_admin AS (
    INSERT INTO admins (name) VALUES ('Plaridel Admin') RETURNING id
)
INSERT INTO admin_credentials (admin_id, email, password_hash)
VALUES (
    (SELECT id FROM new_admin),
    'gocart-plaridel@admin.com',
    crypt('G0C@rT@dmin619Tyg!', gen_salt('bf'))
);

-- 3. Insert Seller and Credentials
WITH new_seller AS (
    INSERT INTO users (name, role, subscription) VALUES ('TechZone Seller', 'seller', 'plus') RETURNING id
)
INSERT INTO user_credentials (user_id, email, password_hash)
VALUES (
    (SELECT id FROM new_seller),
    'seller@techzone.com',
    crypt('password123', gen_salt('bf'))
);

-- 4. Insert Customer and Credentials
WITH new_customer AS (
    INSERT INTO users (name, role) VALUES ('John Buyer', 'customer') RETURNING id
)
INSERT INTO user_credentials (user_id, email, password_hash)
VALUES (
    (SELECT id FROM new_customer),
    'john@buyer.com',
    crypt('password123', gen_salt('bf'))
);

-- 5. Insert Address for Seller (Store Location)
INSERT INTO addresses (user_id, label, full_name, street, city, province, postal_code)
SELECT id, 'Store', 'TechZone Store', '123 Tech Ave', 'Malolos', 'Bulacan', '3000'
FROM users WHERE name = 'TechZone Seller';

-- 6. Insert Store (using address above)
INSERT INTO stores (seller_id, address_id, name, slug, description, status)
SELECT 
    u.id, 
    a.id, 
    'TechZone Electronics', 
    'techzone-electronics', 
    'Best gadgets in town', 
    'approved'
FROM users u
JOIN addresses a ON u.id = a.user_id
WHERE u.name = 'TechZone Seller';

-- 7. Insert Product
INSERT INTO products (store_id, category_slug, name, slug, price, stock)
SELECT 
    s.id, 
    'electronics', 
    'Premium Wireless Headphones', 
    'premium-wireless-headphones', 
    4999.00, 
    100
FROM stores s WHERE s.slug = 'techzone-electronics';

-- 8. Insert Review
INSERT INTO reviews (user_id, product_id, rating, review)
SELECT 
    u.id, 
    p.id, 
    5, 
    'Amazing sound quality!'
FROM users u, products p
WHERE u.name = 'John Buyer' AND p.slug = 'premium-wireless-headphones';
