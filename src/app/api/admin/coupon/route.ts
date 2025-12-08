import { NextResponse } from 'next/server';
import { mockCoupons } from '@/data/mockup';

export async function GET() {
    const activeCoupons = mockCoupons.filter(c => c.isActive);
    return NextResponse.json({ coupons: activeCoupons });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code, description, discountType, discountValue, minPurchase, maxDiscount, usageLimit, forPlusOnly, forNewUsers, expiresAt } = body;

        if (!code || !discountType || !discountValue) {
            return NextResponse.json({ error: 'Code, discount type, and discount value are required' }, { status: 400 });
        }

        // Check if code already exists
        const exists = mockCoupons.some(c => c.code.toUpperCase() === code.toUpperCase());
        if (exists) {
            return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
        }

        const newCoupon = {
            id: `coupon_${Date.now()}`,
            code: code.toUpperCase(),
            description: description || `${discountValue}${discountType === 'percentage' ? '%' : '₱'} off`,
            discountType,
            discountValue,
            minPurchase: minPurchase || 0,
            maxDiscount: maxDiscount || undefined,
            usageLimit: usageLimit || 100,
            usedCount: 0,
            forPlusOnly: forPlusOnly || false,
            forNewUsers: forNewUsers || false,
            expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days default
            isActive: true,
            createdAt: new Date().toISOString(),
        };

        return NextResponse.json({ coupon: newCoupon, message: 'Coupon created successfully' }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Coupon ID is required' }, { status: 400 });
        }

        // In real app, would delete from database
        return NextResponse.json({ message: 'Coupon deleted successfully' });
    } catch {
        return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
    }
}
