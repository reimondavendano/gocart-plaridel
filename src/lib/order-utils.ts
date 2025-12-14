import { supabase } from './supabase';

// ==========================================
// COUPON VALIDATION
// ==========================================
interface CouponValidationResult {
    valid: boolean;
    error?: string;
    discount?: number;
    coupon?: {
        id: string;
        code: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        max_discount: number | null;
    };
}

export async function validateCoupon(
    couponCode: string,
    userId: string,
    subtotal: number,
    userPlan?: string
): Promise<CouponValidationResult> {
    // Fetch coupon
    const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .single();

    if (error || !coupon) {
        return { valid: false, error: 'Invalid coupon code' };
    }

    // Basic checks
    if (!coupon.is_active) {
        return { valid: false, error: 'Coupon is inactive' };
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { valid: false, error: 'Coupon has expired' };
    }

    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
        return { valid: false, error: 'Coupon usage limit reached' };
    }

    // User-specific checks
    if (coupon.for_plus_only && userPlan !== 'plus' && userPlan !== 'pro' && userPlan !== 'enterprise') {
        return { valid: false, error: 'Coupon for Plus members only' };
    }

    // Check if user already used this coupon
    const { data: usage } = await supabase
        .from('coupon_usage')
        .select('id')
        .eq('coupon_id', coupon.id)
        .eq('user_id', userId)
        .single();

    if (usage) {
        return { valid: false, error: 'You have already used this coupon' };
    }

    // Check for new users
    if (coupon.for_new_users) {
        const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (orders && orders.length > 0) {
            return { valid: false, error: 'Coupon for new users only' };
        }
    }

    // Minimum purchase check
    if (subtotal < coupon.min_purchase) {
        return {
            valid: false,
            error: `Minimum purchase of ₱${coupon.min_purchase.toLocaleString()} required`
        };
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
        discount = (subtotal * coupon.discount_value) / 100;
        if (coupon.max_discount) {
            discount = Math.min(discount, coupon.max_discount);
        }
    } else {
        discount = coupon.discount_value;
    }

    // Ensure discount doesn't exceed subtotal
    discount = Math.min(discount, subtotal);

    return {
        valid: true,
        discount,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            max_discount: coupon.max_discount
        }
    };
}

// Record coupon usage
export async function recordCouponUsage(
    couponId: string,
    userId: string,
    orderId: string,
    discountApplied: number
) {
    await supabase.from('coupon_usage').insert({
        coupon_id: couponId,
        user_id: userId,
        order_id: orderId,
        discount_applied: discountApplied
    });

    // Increment used count
    await supabase.rpc('increment_coupon_usage', { p_coupon_id: couponId });
}

// ==========================================
// STOCK MANAGEMENT
// ==========================================
interface StockCheckResult {
    available: boolean;
    availableQuantity: number;
    message?: string;
}

export async function checkStockAvailability(
    productId: string,
    requestedQuantity: number
): Promise<StockCheckResult> {
    const { data: product, error } = await supabase
        .from('products')
        .select('stock, reserved_stock, sold_stock, name')
        .eq('id', productId)
        .single();

    if (error || !product) {
        return { available: false, availableQuantity: 0, message: 'Product not found' };
    }

    const availableStock = product.stock - (product.reserved_stock || 0);

    if (availableStock <= 0) {
        return { available: false, availableQuantity: 0, message: 'Out of stock' };
    }

    if (availableStock < requestedQuantity) {
        return {
            available: false,
            availableQuantity: availableStock,
            message: `Only ${availableStock} items available`
        };
    }

    return { available: true, availableQuantity: availableStock };
}

export async function reserveStock(
    orderId: string,
    items: { productId: string; quantity: number }[],
    expiryMinutes: number = 30
): Promise<{ success: boolean; error?: string }> {
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

    for (const item of items) {
        // Check availability
        const check = await checkStockAvailability(item.productId, item.quantity);
        if (!check.available) {
            return { success: false, error: check.message };
        }

        // Create reservation
        const { error: reserveError } = await supabase
            .from('stock_reservations')
            .insert({
                order_id: orderId,
                product_id: item.productId,
                quantity: item.quantity,
                expires_at: expiresAt,
                status: 'active'
            });

        if (reserveError) {
            return { success: false, error: 'Failed to reserve stock' };
        }

        // Increment reserved stock on product
        await supabase
            .from('products')
            .update({
                reserved_stock: supabase.rpc('add_reserved_stock', {
                    p_product_id: item.productId,
                    p_quantity: item.quantity
                })
            })
            .eq('id', item.productId);
    }

    return { success: true };
}

export async function releaseStockReservation(orderId: string) {
    const { data: reservations } = await supabase
        .from('stock_reservations')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'active');

    if (!reservations) return;

    for (const res of reservations) {
        // Decrement reserved stock
        const { data: product } = await supabase
            .from('products')
            .select('reserved_stock')
            .eq('id', res.product_id)
            .single();

        if (product) {
            await supabase
                .from('products')
                .update({
                    reserved_stock: Math.max(0, (product.reserved_stock || 0) - res.quantity)
                })
                .eq('id', res.product_id);
        }

        // Mark reservation as released
        await supabase
            .from('stock_reservations')
            .update({ status: 'released' })
            .eq('id', res.id);
    }
}

export async function confirmStockReservation(orderId: string) {
    const { data: reservations } = await supabase
        .from('stock_reservations')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'active');

    if (!reservations) return;

    for (const res of reservations) {
        const { data: product } = await supabase
            .from('products')
            .select('stock, reserved_stock, sold_stock')
            .eq('id', res.product_id)
            .single();

        if (product) {
            await supabase
                .from('products')
                .update({
                    stock: Math.max(0, product.stock - res.quantity),
                    reserved_stock: Math.max(0, (product.reserved_stock || 0) - res.quantity),
                    sold_stock: (product.sold_stock || 0) + res.quantity
                })
                .eq('id', res.product_id);
        }

        // Mark reservation as confirmed
        await supabase
            .from('stock_reservations')
            .update({ status: 'confirmed' })
            .eq('id', res.id);
    }
}

// ==========================================
// ORDER STATUS MANAGEMENT
// ==========================================
export async function updateOrderStatus(
    orderId: string,
    newStatus: string,
    changedBy: string | null,
    changedByRole: 'customer' | 'seller' | 'admin' | 'system',
    notes?: string
) {
    // Get current status
    const { data: order } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

    const oldStatus = order?.status;

    // Update order
    await supabase
        .from('orders')
        .update({
            status: newStatus,
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

    // Log status change
    await supabase.from('order_status_history').insert({
        order_id: orderId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: changedBy,
        changed_by_role: changedByRole,
        notes
    });
}

// ==========================================
// NOTIFICATION HELPERS
// ==========================================
export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string
) {
    await supabase.from('notifications').insert({
        user_id: userId,
        type,
        title,
        message,
        link
    });
}

export async function markNotificationAsRead(notificationId: string) {
    await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
    const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    return count || 0;
}
