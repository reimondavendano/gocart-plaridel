// GoCart Plaridel - Multi-Vendor E-Commerce Mock Data
// Database: Supabase (PostgreSQL)

export type UserRole = 'admin' | 'seller' | 'customer';
export type SubscriptionPlan = 'free' | 'plus';
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
export type PaymentMethod = 'cod' | 'xendit';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type StoreStatus = 'pending' | 'approved' | 'rejected';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar: string;
    role: UserRole;
    subscription: SubscriptionPlan;
    phone?: string;
    passwordHash?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Store {
    id: string;
    sellerId: string;
    name: string;
    slug: string;
    description: string;
    logo: string;
    banner: string;
    status: StoreStatus;
    rating: number;
    totalReviews: number;
    totalProducts: number;
    totalSales: number;
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
    image: string;
    description: string;
    productCount: number;
}

export interface Product {
    id: string;
    storeId: string;
    storeName: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    comparePrice?: number;
    images: string[];
    category: string;
    stock: number;
    inStock: boolean;
    rating: number;
    reviewCount: number;
    tags: string[];
    isFeatured: boolean;
    isNew: boolean;
    aiGenerated?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CartItem {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    price: number;
}

export interface Address {
    id: string;
    userId: string;
    label: string;
    fullName: string;
    phone: string;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}

export interface Coupon {
    id: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minPurchase: number;
    maxDiscount?: number;
    usageLimit: number;
    usedCount: number;
    forPlusOnly: boolean;
    forNewUsers: boolean;
    expiresAt: string;
    isActive: boolean;
    createdAt: string;
}

export interface Order {
    id: string;
    userId: string;
    storeId: string;
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    shippingAddress: Address;
    couponCode?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    total: number;
}

export interface Rating {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    productId: string;
    orderId: string;
    rating: number;
    review: string;
    images?: string[];
    createdAt: string;
}

// Mock Users
export const mockUsers: User[] = [
    {
        id: 'usr_admin_001',
        email: 'gocart-plaridel@admin.com',
        name: 'Plaridel Admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        role: 'admin',
        subscription: 'plus',
        phone: '+63 917 123 4567',
        passwordHash: '$2a$10$X7...', // Mock bcrypt hash for 'G0C@rT@dmin619Tyg!'
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'usr_seller_001',
        email: 'techzone@seller.com',
        name: 'TechZone Store',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techzone',
        role: 'seller',
        subscription: 'plus',
        phone: '+63 918 234 5678',
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'usr_seller_002',
        email: 'fashionhub@seller.com',
        name: 'Fashion Hub',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fashion',
        role: 'seller',
        subscription: 'free',
        phone: '+63 919 345 6789',
        createdAt: '2024-03-10T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'usr_customer_001',
        email: 'john.doe@email.com',
        name: 'John Doe',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        role: 'customer',
        subscription: 'plus',
        phone: '+63 920 456 7890',
        createdAt: '2024-04-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'usr_customer_002',
        email: 'jane.smith@email.com',
        name: 'Jane Smith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
        role: 'customer',
        subscription: 'free',
        phone: '+63 921 567 8901',
        createdAt: '2024-05-15T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
];

// Mock Stores
export const mockStores: Store[] = [
    {
        id: 'store_001',
        sellerId: 'usr_seller_001',
        name: 'TechZone Electronics',
        slug: 'techzone-electronics',
        description: 'Your one-stop shop for premium electronics and gadgets. We offer the latest tech at competitive prices.',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=techzone',
        banner: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200',
        status: 'approved',
        rating: 4.8,
        totalReviews: 256,
        totalProducts: 48,
        totalSales: 1250,
        createdAt: '2024-02-15T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'store_002',
        sellerId: 'usr_seller_002',
        name: 'Fashion Hub Philippines',
        slug: 'fashion-hub-ph',
        description: 'Trendy and affordable fashion for everyone. From casual wear to formal attire.',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=fashionhub',
        banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
        status: 'approved',
        rating: 4.6,
        totalReviews: 189,
        totalProducts: 124,
        totalSales: 890,
        createdAt: '2024-03-10T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'store_003',
        sellerId: 'usr_seller_003',
        name: 'Home Essentials Co.',
        slug: 'home-essentials',
        description: 'Quality home and living products to make your house a home.',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=homeessentials',
        banner: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200',
        status: 'approved',
        rating: 4.5,
        totalReviews: 145,
        totalProducts: 67,
        totalSales: 520,
        createdAt: '2024-04-20T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'store_004',
        sellerId: 'usr_seller_004',
        name: 'Beauty Bliss PH',
        slug: 'beauty-bliss-ph',
        description: 'Premium skincare and cosmetics. Your journey to radiant skin starts here.',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=beautybliss',
        banner: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200',
        status: 'approved',
        rating: 4.9,
        totalReviews: 312,
        totalProducts: 89,
        totalSales: 1560,
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'store_005',
        sellerId: 'usr_seller_005',
        name: 'Sports Central',
        slug: 'sports-central',
        description: 'Everything you need for your active lifestyle. From gym equipment to outdoor gear.',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=sportscentral',
        banner: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200',
        status: 'approved',
        rating: 4.7,
        totalReviews: 178,
        totalProducts: 56,
        totalSales: 780,
        createdAt: '2024-05-05T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'store_006',
        sellerId: 'usr_seller_006',
        name: 'Bookworm Haven',
        slug: 'bookworm-haven',
        description: 'Books, stationery, and everything for the avid reader and learner.',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=bookworm',
        banner: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200',
        status: 'approved',
        rating: 4.8,
        totalReviews: 234,
        totalProducts: 143,
        totalSales: 920,
        createdAt: '2024-02-28T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'store_007',
        sellerId: 'usr_seller_007',
        name: 'Gadget Galaxy',
        slug: 'gadget-galaxy',
        description: 'Latest gadgets and accessories at unbeatable prices.',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=gadgetgalaxy',
        banner: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200',
        status: 'approved',
        rating: 4.4,
        totalReviews: 98,
        totalProducts: 34,
        totalSales: 340,
        createdAt: '2024-06-15T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'store_008',
        sellerId: 'usr_seller_008',
        name: 'Plaridel Fresh Market',
        slug: 'plaridel-fresh-market',
        description: 'Fresh produce and groceries delivered to your doorstep.',
        logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=freshmarket',
        banner: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200',
        status: 'approved',
        rating: 4.6,
        totalReviews: 156,
        totalProducts: 78,
        totalSales: 680,
        createdAt: '2024-03-25T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
];

// Mock Categories
export const mockCategories: Category[] = [
    { id: 'cat_001', name: 'Electronics', slug: 'electronics', icon: 'Smartphone', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800', description: 'Gadgets and devices', productCount: 156 },
    { id: 'cat_002', name: 'Fashion', slug: 'fashion', icon: 'Shirt', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800', description: 'Clothing and accessories', productCount: 324 },
    { id: 'cat_003', name: 'Home & Living', slug: 'home-living', icon: 'Home', image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800', description: 'Furniture and decor', productCount: 89 },
    { id: 'cat_004', name: 'Beauty', slug: 'beauty', icon: 'Sparkles', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800', description: 'Skincare and cosmetics', productCount: 201 },
    { id: 'cat_005', name: 'Sports', slug: 'sports', icon: 'Dumbbell', image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800', description: 'Fitness and outdoor', productCount: 67 },
    { id: 'cat_006', name: 'Books', slug: 'books', icon: 'BookOpen', image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800', description: 'Books and stationery', productCount: 143 },
];

// Mock Products
export const mockProducts: Product[] = [
    {
        id: 'prod_001',
        storeId: 'store_001',
        storeName: 'TechZone Electronics',
        name: 'Premium Wireless Headphones Pro X',
        slug: 'premium-wireless-headphones-pro-x',
        description: 'Experience crystal-clear audio with our flagship wireless headphones. Features active noise cancellation, 40-hour battery life, and premium comfort.',
        price: 4999,
        comparePrice: 6999,
        images: [
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
            'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
        ],
        category: 'electronics',
        stock: 50,
        inStock: true,
        rating: 4.9,
        reviewCount: 128,
        tags: ['headphones', 'wireless', 'audio', 'premium'],
        isFeatured: true,
        isNew: true,
        createdAt: '2024-10-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'prod_002',
        storeId: 'store_001',
        storeName: 'TechZone Electronics',
        name: 'Smart Watch Series 5',
        slug: 'smart-watch-series-5',
        description: 'Stay connected and track your fitness with our advanced smartwatch. Heart rate monitoring, GPS, and 7-day battery.',
        price: 8999,
        comparePrice: 10999,
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
        category: 'electronics',
        stock: 35,
        inStock: true,
        rating: 4.7,
        reviewCount: 89,
        tags: ['smartwatch', 'fitness', 'wearable'],
        isFeatured: true,
        isNew: false,
        createdAt: '2024-09-15T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'prod_003',
        storeId: 'store_002',
        storeName: 'Fashion Hub Philippines',
        name: 'Classic Leather Jacket - Brown',
        slug: 'classic-leather-jacket-brown',
        description: 'Timeless style meets modern comfort. Genuine leather jacket perfect for any occasion.',
        price: 3499,
        images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'],
        category: 'fashion',
        stock: 25,
        inStock: true,
        rating: 4.5,
        reviewCount: 45,
        tags: ['jacket', 'leather', 'men', 'fashion'],
        isFeatured: true,
        isNew: false,
        createdAt: '2024-08-20T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'prod_004',
        storeId: 'store_002',
        storeName: 'Fashion Hub Philippines',
        name: 'Designer Handbag Collection',
        slug: 'designer-handbag-collection',
        description: 'Elegant designer handbag crafted from premium materials. Perfect for work or special occasions.',
        price: 2999,
        comparePrice: 3999,
        images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800'],
        category: 'fashion',
        stock: 15,
        inStock: true,
        rating: 4.8,
        reviewCount: 67,
        tags: ['handbag', 'designer', 'women', 'accessories'],
        isFeatured: false,
        isNew: true,
        createdAt: '2024-11-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'prod_005',
        storeId: 'store_001',
        storeName: 'TechZone Electronics',
        name: 'Portable Bluetooth Speaker',
        slug: 'portable-bluetooth-speaker',
        description: '360° immersive sound with deep bass. Waterproof design perfect for outdoor adventures.',
        price: 1999,
        images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'],
        category: 'electronics',
        stock: 100,
        inStock: true,
        rating: 4.6,
        reviewCount: 234,
        tags: ['speaker', 'bluetooth', 'portable', 'audio'],
        isFeatured: false,
        isNew: false,
        createdAt: '2024-07-10T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
    {
        id: 'prod_006',
        storeId: 'store_001',
        storeName: 'TechZone Electronics',
        name: 'Mechanical Gaming Keyboard RGB',
        slug: 'mechanical-gaming-keyboard-rgb',
        description: 'Professional gaming keyboard with Cherry MX switches and per-key RGB lighting.',
        price: 5499,
        images: ['https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=800'],
        category: 'electronics',
        stock: 40,
        inStock: true,
        rating: 4.9,
        reviewCount: 156,
        tags: ['keyboard', 'gaming', 'mechanical', 'rgb'],
        isFeatured: true,
        isNew: true,
        aiGenerated: true,
        createdAt: '2024-11-15T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
    },
];

// Mock Coupons
export const mockCoupons: Coupon[] = [
    {
        id: 'coupon_001',
        code: 'WELCOME10',
        description: '10% off for new users',
        discountType: 'percentage',
        discountValue: 10,
        minPurchase: 500,
        maxDiscount: 500,
        usageLimit: 1000,
        usedCount: 234,
        forPlusOnly: false,
        forNewUsers: true,
        expiresAt: '2025-01-31T23:59:59Z',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 'coupon_002',
        code: 'PLUS20',
        description: '20% off for Plus members',
        discountType: 'percentage',
        discountValue: 20,
        minPurchase: 1000,
        maxDiscount: 1000,
        usageLimit: 500,
        usedCount: 89,
        forPlusOnly: true,
        forNewUsers: false,
        expiresAt: '2025-06-30T23:59:59Z',
        isActive: true,
        createdAt: '2024-06-01T00:00:00Z',
    },
    {
        id: 'coupon_003',
        code: 'FREESHIP',
        description: 'Free shipping on orders over ₱2000',
        discountType: 'fixed',
        discountValue: 150,
        minPurchase: 2000,
        usageLimit: 2000,
        usedCount: 567,
        forPlusOnly: false,
        forNewUsers: false,
        expiresAt: '2025-03-31T23:59:59Z',
        isActive: true,
        createdAt: '2024-03-01T00:00:00Z',
    },
];

// Mock Addresses
export const mockAddresses: Address[] = [
    {
        id: 'addr_001',
        userId: 'usr_customer_001',
        label: 'Home',
        fullName: 'John Doe',
        phone: '+63 920 456 7890',
        street: '123 Rizal Street, Barangay San Antonio',
        city: 'Makati City',
        province: 'Metro Manila',
        postalCode: '1234',
        country: 'Philippines',
        isDefault: true,
    },
    {
        id: 'addr_002',
        userId: 'usr_customer_001',
        label: 'Office',
        fullName: 'John Doe',
        phone: '+63 920 456 7890',
        street: '456 Ayala Avenue, 25th Floor',
        city: 'Makati City',
        province: 'Metro Manila',
        postalCode: '1226',
        country: 'Philippines',
        isDefault: false,
    },
];

// Mock Orders
export const mockOrders: Order[] = [
    {
        id: 'order_001',
        userId: 'usr_customer_001',
        storeId: 'store_001',
        items: [
            {
                productId: 'prod_001',
                productName: 'Premium Wireless Headphones Pro X',
                productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
                quantity: 1,
                price: 4999,
                total: 4999,
            },
        ],
        subtotal: 4999,
        shipping: 150,
        discount: 500,
        total: 4649,
        status: 'delivered',
        paymentMethod: 'xendit',
        paymentStatus: 'paid',
        shippingAddress: mockAddresses[0],
        couponCode: 'WELCOME10',
        createdAt: '2024-11-15T10:30:00Z',
        updatedAt: '2024-11-20T14:00:00Z',
    },
    {
        id: 'order_002',
        userId: 'usr_customer_001',
        storeId: 'store_002',
        items: [
            {
                productId: 'prod_003',
                productName: 'Classic Leather Jacket - Brown',
                productImage: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200',
                quantity: 1,
                price: 3499,
                total: 3499,
            },
        ],
        subtotal: 3499,
        shipping: 0,
        discount: 0,
        total: 3499,
        status: 'processing',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        shippingAddress: mockAddresses[0],
        createdAt: '2024-12-05T09:15:00Z',
        updatedAt: '2024-12-05T09:15:00Z',
    },
    {
        id: 'order_003',
        userId: 'usr_customer_001',
        storeId: 'store_001',
        items: [
            {
                productId: 'prod_002',
                productName: 'Smart Fitness Watch - Series 5',
                productImage: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=200',
                quantity: 1,
                price: 2499,
                total: 2499,
            },
        ],
        subtotal: 2499,
        shipping: 50,
        discount: 0,
        total: 2549,
        status: 'shipped',
        paymentMethod: 'xendit',
        paymentStatus: 'paid',
        shippingAddress: mockAddresses[0],
        createdAt: '2024-12-06T14:20:00Z',
        updatedAt: '2024-12-07T08:00:00Z',
    },
    {
        id: 'order_004',
        userId: 'usr_customer_001',
        storeId: 'store_003',
        items: [
            {
                productId: 'prod_005',
                productName: 'Ergonomic Office Chair',
                productImage: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=200',
                quantity: 1,
                price: 5999,
                total: 5999,
            },
        ],
        subtotal: 5999,
        shipping: 500,
        discount: 0,
        total: 6499,
        status: 'pending',
        paymentMethod: 'xendit',
        paymentStatus: 'pending',
        shippingAddress: mockAddresses[0],
        createdAt: '2024-12-08T08:00:00Z',
        updatedAt: '2024-12-08T08:00:00Z',
    },
    {
        id: 'order_005',
        userId: 'usr_customer_001',
        storeId: 'store_002',
        items: [
            {
                productId: 'prod_004',
                productName: 'Designer Handbag',
                productImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=200',
                quantity: 1,
                price: 2999,
                total: 2999,
            },
        ],
        subtotal: 2999,
        shipping: 0,
        discount: 0,
        total: 2999,
        status: 'cancelled',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        shippingAddress: mockAddresses[0],
        createdAt: '2024-12-01T10:00:00Z',
        updatedAt: '2024-12-01T12:00:00Z',
    },
    {
        id: 'order_006',
        userId: 'usr_customer_001',
        storeId: 'store_001',
        items: [
            {
                productId: 'prod_006',
                productName: 'Wireless Mouse',
                productImage: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=200',
                quantity: 2,
                price: 999,
                total: 1998,
            },
        ],
        subtotal: 1998,
        shipping: 50,
        discount: 0,
        total: 2048,
        status: 'returned',
        paymentMethod: 'xendit',
        paymentStatus: 'paid',
        shippingAddress: mockAddresses[0],
        createdAt: '2024-11-25T15:00:00Z',
        updatedAt: '2024-11-30T09:00:00Z',
    },
];

// Mock Ratings
export const mockRatings: Rating[] = [
    {
        id: 'rating_001',
        userId: 'usr_customer_001',
        userName: 'John Doe',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        productId: 'prod_001',
        orderId: 'order_001',
        rating: 5,
        review: 'Absolutely amazing headphones! The sound quality is incredible and noise cancellation works perfectly.',
        createdAt: '2024-11-22T10:00:00Z',
    },
    {
        id: 'rating_002',
        userId: 'usr_customer_002',
        userName: 'Jane Smith',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
        productId: 'prod_001',
        orderId: 'order_003',
        rating: 4,
        review: 'Great headphones, comfortable for long use. Battery life is impressive.',
        createdAt: '2024-11-25T15:30:00Z',
    },
];

// Subscription Plans
export const subscriptionPlans = {
    free: {
        name: 'Free',
        price: 0,
        features: [
            'Access to all products',
            'Standard shipping rates',
            'Basic customer support',
            'Order tracking',
        ],
    },
    plus: {
        name: 'Plus',
        price: 199,
        features: [
            'Exclusive Plus-only coupons',
            'Free shipping on all orders',
            'Priority customer support',
            'Early access to sales',
            '5% cashback on purchases',
            '7-day free trial',
        ],
    },
};

// Dashboard Stats
export const adminDashboardStats = {
    totalOrders: 1250,
    totalRevenue: 5890000,
    totalProducts: 456,
    totalUsers: 3245,
    totalStores: 28,
    pendingStores: 5,
    ordersToday: 45,
    revenueToday: 125000,
};

export const sellerDashboardStats = {
    totalOrders: 156,
    totalRevenue: 890000,
    totalProducts: 48,
    pendingOrders: 12,
    averageRating: 4.8,
    totalReviews: 256,
};
