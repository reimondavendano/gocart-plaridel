export type UserRole = 'admin' | 'seller' | 'customer';
// SubscriptionPlan removed, replaced by Plan interface
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'refunded';
export type PaymentMethod = 'cod' | 'xendit';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type StoreStatus = 'pending' | 'approved' | 'rejected';

export interface Plan {
    id: string;
    name: string;
    price: number;
    currency: string;
    features: string[];
    maxStores: number;
    maxProducts: number;
    transactionFee: number;
    isActive: boolean;
    createdAt: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatar: string;
    role: UserRole;
    planId: string | null;
    plan?: Plan;
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
    addressId?: string;
    status: StoreStatus;
    // Verification Documents
    validIdFront?: string;
    validIdBack?: string;
    businessPermit?: string;
    selfieImage?: string;
    // Geolocation
    latitude?: number;
    longitude?: number;
    // Admin Verification
    verificationNotes?: string;
    verifiedAt?: string;
    verifiedBy?: string;
    // Stats
    rating: number;
    totalReviews?: number;
    totalProducts: number;
    totalSales?: number;
    verified?: boolean;
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
    storeName?: string; // Optional because join might be needed
    name: string;
    slug: string;
    description: string;
    price: number;
    comparePrice?: number;
    images: string[];
    category: string;
    stock: number;
    inStock?: boolean;
    rating: number;
    reviewCount: number;
    tags: string[];
    isFeatured?: boolean;
    isNew?: boolean;
    aiGenerated?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CartItem {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    price: number;
    total: number;
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
