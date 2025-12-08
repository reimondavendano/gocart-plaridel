import { NextResponse } from 'next/server';
import { mockOrders } from '@/data/mockup';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const storeId = searchParams.get('storeId');

    let orders = [...mockOrders];

    if (userId) {
        orders = orders.filter(o => o.userId === userId);
    }

    if (storeId) {
        orders = orders.filter(o => o.storeId === storeId);
    }

    return NextResponse.json({ orders });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, storeId, items, shippingAddressId, paymentMethod, couponCode } = body;

        if (!userId || !storeId || !items || items.length === 0 || !shippingAddressId || !paymentMethod) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Calculate totals
        const subtotal = items.reduce((sum: number, item: { price: number; quantity: number }) =>
            sum + (item.price * item.quantity), 0);
        const shipping = 150; // Would be calculated based on address/promo
        const discount = 0; // Would be calculated based on coupon
        const total = subtotal + shipping - discount;

        const orderNumber = `GCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        const newOrder = {
            id: `order_${Date.now()}`,
            orderNumber,
            userId,
            storeId,
            items,
            subtotal,
            shipping,
            discount,
            total,
            status: 'pending' as const,
            paymentMethod,
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending' as const,
            shippingAddressId,
            couponCode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // If Xendit payment, would create checkout session
        let xenditCheckoutUrl = null;
        if (paymentMethod === 'xendit') {
            // In production, would call Xendit API
            xenditCheckoutUrl = `https://checkout.xendit.co/mock-session-${Date.now()}`;
        }

        return NextResponse.json({
            order: newOrder,
            xenditCheckoutUrl,
            message: 'Order created successfully',
        }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
