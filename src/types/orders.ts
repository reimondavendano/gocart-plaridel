// Order Management Types

// Simplified order status - payment state tracked separately via PaymentStatus
export type OrderStatus =
    | 'pending'      // Awaiting seller approval or payment
    | 'processing'   // Seller approved, preparing order
    | 'shipped'      // Out for delivery
    | 'delivered'    // Arrived at customer
    | 'completed'    // Customer confirmed receipt
    | 'cancelled'    // Order cancelled
    | 'refunded';    // Refund processed

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
export type PaymentMethod = 'cod' | 'xendit';
export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processed';
export type ReservationStatus = 'active' | 'confirmed' | 'released' | 'expired';

export interface Order {
    id: string;
    userId: string;
    storeId: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    shippingAddressId: string;
    couponCode?: string;
    notes?: string;
    // Additional fields
    sellerApprovedAt?: string;
    rejectionReason?: string;
    reservationExpiresAt?: string;
    paymentDeadline?: string;
    xenditInvoiceId?: string;
    xenditInvoiceUrl?: string;
    trackingNumber?: string;
    deliveredAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    // Joined data
    items?: OrderItem[];
    user?: { name: string; email: string; phone?: string };
    store?: { name: string; slug: string };
    shippingAddress?: Address;
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    total: number;
}

export interface Address {
    id: string;
    userId: string;
    label: string;
    completeAddress: string;
    cityId?: string;
    barangayId?: string;
    latitude?: number;
    longitude?: number;
    isDefault: boolean;
    city?: { name: string };
    barangay?: { name: string };
}

export interface StockReservation {
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    reservedAt: string;
    expiresAt: string;
    status: ReservationStatus;
    createdAt: string;
}

export interface OrderStatusHistory {
    id: string;
    orderId: string;
    oldStatus?: OrderStatus;
    newStatus: OrderStatus;
    changedBy?: string;
    changedByRole: 'customer' | 'seller' | 'admin' | 'system';
    notes?: string;
    createdAt: string;
}

export interface CouponUsage {
    id: string;
    couponId: string;
    userId: string;
    orderId?: string;
    discountApplied: number;
    usedAt: string;
}

export interface PaymentTransaction {
    id: string;
    orderId: string;
    paymentMethod: PaymentMethod;
    xenditInvoiceId?: string;
    xenditPaymentId?: string;
    amount: number;
    status: PaymentStatus;
    paidAt?: string;
    refundedAt?: string;
    refundAmount?: number;
    webhookData?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
}

export interface RefundRequest {
    id: string;
    orderId: string;
    userId: string;
    reason: string;
    images?: string[];
    requestedAmount: number;
    status: RefundStatus;
    adminNotes?: string;
    processedBy?: string;
    requestedAt: string;
    processedAt?: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

// Order status display helpers - simplified
export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; description: string }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', description: 'Awaiting approval or payment' },
    processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', description: 'Seller is preparing your order' },
    shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', description: 'Out for delivery' },
    delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', description: 'Successfully delivered' },
    completed: { label: 'Completed', color: 'bg-green-100 text-green-800', description: 'Order completed' },
    cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-800', description: 'Order cancelled' },
    refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', description: 'Refund processed' },
};
