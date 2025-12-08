import { NextResponse } from 'next/server';
import { mockStores } from '@/data/mockup';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { storeId, action } = body;

        if (!storeId || !action) {
            return NextResponse.json({ error: 'Store ID and action are required' }, { status: 400 });
        }

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Action must be "approve" or "reject"' }, { status: 400 });
        }

        const store = mockStores.find(s => s.id === storeId);
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // In real app, would update database
        const updatedStore = {
            ...store,
            status: action === 'approve' ? 'approved' : 'rejected',
            updatedAt: new Date().toISOString(),
        };

        // Would also send notification to seller
        // await sendNotification(store.sellerId, `Your store has been ${action}ed`);

        return NextResponse.json({
            store: updatedStore,
            message: `Store ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        });
    } catch {
        return NextResponse.json({ error: 'Failed to update store status' }, { status: 500 });
    }
}
