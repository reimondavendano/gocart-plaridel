import { NextResponse } from 'next/server';
import { mockStores } from '@/data/mockup';

export async function GET() {
    // Return approved stores
    const approvedStores = mockStores.filter(s => s.status === 'approved');
    return NextResponse.json({ stores: approvedStores });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, logo } = body;

        // Validate required fields
        if (!name || !description) {
            return NextResponse.json(
                { error: 'Name and description are required' },
                { status: 400 }
            );
        }

        // Create slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // In real app, would save to database
        const newStore = {
            id: `store_${Date.now()}`,
            sellerId: 'usr_seller_001', // Would come from auth
            name,
            slug,
            description,
            logo: logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${slug}`,
            banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200',
            status: 'pending' as const,
            rating: 0,
            totalReviews: 0,
            totalProducts: 0,
            totalSales: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json({ store: newStore, message: 'Store created successfully' }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create store' }, { status: 500 });
    }
}
