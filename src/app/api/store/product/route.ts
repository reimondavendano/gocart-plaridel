import { NextResponse } from 'next/server';
import { mockProducts } from '@/data/mockup';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const search = searchParams.get('search');

    let products = [...mockProducts];

    if (storeId) {
        products = products.filter(p => p.storeId === storeId);
    }

    if (category) {
        products = products.filter(p => p.category === category);
    }

    if (featured === 'true') {
        products = products.filter(p => p.isFeatured);
    }

    if (search) {
        const query = search.toLowerCase();
        products = products.filter(
            p => p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.tags.some(t => t.toLowerCase().includes(query))
        );
    }

    return NextResponse.json({ products });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { storeId, name, description, price, category, images, stock, tags } = body;

        // Validate required fields
        if (!storeId || !name || !price) {
            return NextResponse.json(
                { error: 'Store ID, name, and price are required' },
                { status: 400 }
            );
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        const newProduct = {
            id: `prod_${Date.now()}`,
            storeId,
            storeName: 'TechZone Electronics', // Would be fetched from store
            name,
            slug,
            description: description || '',
            price,
            images: images || [],
            category: category || 'electronics',
            stock: stock || 0,
            inStock: stock > 0,
            rating: 0,
            reviewCount: 0,
            tags: tags || [],
            isFeatured: false,
            isNew: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        return NextResponse.json({ product: newProduct, message: 'Product created successfully' }, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}
