import { NextResponse } from 'next/server';
import { mockCoupons, mockUsers } from '@/data/mockup';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, userId, cartTotal } = body;

        if (!code) {
            return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
        }

        const coupon = mockCoupons.find(c => c.code.toUpperCase() === code.toUpperCase());

        if (!coupon) {
            return NextResponse.json({ valid: false, error: 'Invalid coupon code' }, { status: 404 });
        }

        // Check if coupon is active
        if (!coupon.isActive) {
            return NextResponse.json({ valid: false, error: 'This coupon is no longer active' });
        }

        // Check expiry
        if (new Date(coupon.expiresAt) < new Date()) {
            return NextResponse.json({ valid: false, error: 'This coupon has expired' });
        }

        // Check usage limit
        if (coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({ valid: false, error: 'This coupon has reached its usage limit' });
        }

        // Check minimum purchase
        if (cartTotal && cartTotal < coupon.minPurchase) {
            return NextResponse.json({
                valid: false,
                error: `Minimum purchase of ₱${coupon.minPurchase} required`
            });
        }

        // Check Plus membership requirement
        if (coupon.forPlusOnly && userId) {
            const user = mockUsers.find(u => u.id === userId);
            if (!user || user.subscription !== 'plus') {
                return NextResponse.json({
                    valid: false,
                    error: 'This coupon is only available for Plus members'
                });
            }
        }

        // Check new user requirement
        if (coupon.forNewUsers && userId) {
            const user = mockUsers.find(u => u.id === userId);
            // In real app, would check if user has made any orders
            // For mock, we'll assume user is not new if they exist
            if (user && !user.name.includes('New')) {
                return NextResponse.json({
                    valid: false,
                    error: 'This coupon is only available for new users'
                });
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = (cartTotal || 0) * (coupon.discountValue / 100);
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.discountValue;
        }

        return NextResponse.json({
            valid: true,
            coupon: {
                code: coupon.code,
                description: coupon.description,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount: Math.round(discountAmount),
            },
            message: 'Coupon applied successfully',
        });
    } catch {
        return NextResponse.json({ error: 'Failed to verify coupon' }, { status: 500 });
    }
}
