import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client for server-side operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Xendit Webhook Handler for payment verification
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            external_id,
            status,
            paid_amount,
            payment_method,
            id: xendit_payment_id
        } = body;

        // Verify webhook signature (in production)
        const callbackToken = request.headers.get('x-callback-token');
        if (process.env.XENDIT_WEBHOOK_TOKEN && callbackToken !== process.env.XENDIT_WEBHOOK_TOKEN) {
            console.error('Invalid Xendit webhook signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        console.log('Xendit Webhook Received:', {
            external_id,
            status,
            paid_amount,
            payment_method,
        });

        // Log the webhook event
        await supabase.from('payment_transactions').upsert({
            order_id: external_id,
            xendit_invoice_id: body.id || body.invoice_id,
            xendit_payment_id,
            amount: paid_amount || body.amount,
            payment_method: 'xendit',
            status: status === 'PAID' ? 'paid' : status === 'EXPIRED' ? 'expired' : 'failed',
            paid_at: status === 'PAID' ? new Date().toISOString() : null,
            webhook_data: body,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'order_id' });

        // Handle different payment statuses
        switch (status) {
            case 'PAID':
                // Get current order status first
                const { data: currentOrder } = await supabase
                    .from('orders')
                    .select('status')
                    .eq('id', external_id)
                    .single();

                const oldStatus = currentOrder?.status || 'pending';

                // Update order - payment confirmed, awaiting seller processing
                await supabase
                    .from('orders')
                    .update({
                        payment_status: 'paid',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', external_id);

                // Log status change
                await supabase.from('order_status_history').insert({
                    order_id: external_id,
                    old_status: oldStatus,
                    new_status: oldStatus, // Status doesn't change, only payment status
                    changed_by_role: 'system',
                    notes: `Payment confirmed via Xendit. Amount: ₱${paid_amount}`
                });

                // Convert reserved stock to sold stock
                const { data: reservations } = await supabase
                    .from('stock_reservations')
                    .select('*')
                    .eq('order_id', external_id)
                    .eq('status', 'active');

                if (reservations) {
                    for (const res of reservations) {
                        // Update product stock
                        await supabase.rpc('confirm_stock_reservation', {
                            p_product_id: res.product_id,
                            p_quantity: res.quantity
                        });

                        // Mark reservation as confirmed
                        await supabase
                            .from('stock_reservations')
                            .update({ status: 'confirmed' })
                            .eq('id', res.id);
                    }
                }

                console.log(`Order ${external_id} marked as PAID`);
                break;

            case 'EXPIRED':
                // Update order status to cancelled
                await supabase
                    .from('orders')
                    .update({
                        status: 'cancelled',
                        payment_status: 'expired',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', external_id);

                // Release stock reservations
                await releaseStockReservations(external_id);

                // Log status change
                await supabase.from('order_status_history').insert({
                    order_id: external_id,
                    old_status: 'pending',
                    new_status: 'cancelled',
                    changed_by_role: 'system',
                    notes: 'Payment expired - order cancelled'
                });

                console.log(`Order ${external_id} payment EXPIRED`);
                break;

            case 'FAILED':
                // Update order payment status
                await supabase
                    .from('orders')
                    .update({
                        payment_status: 'failed',
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', external_id);

                console.log(`Order ${external_id} payment FAILED`);
                break;

            default:
                console.log(`Unknown status: ${status}`);
        }

        // Always return 200 to acknowledge receipt
        return NextResponse.json({
            received: true,
            message: 'Webhook processed successfully',
        });
    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({
            received: true,
            error: 'Processing error',
        });
    }
}

// Helper function to release stock reservations
async function releaseStockReservations(orderId: string) {
    const { data: reservations } = await supabase
        .from('stock_reservations')
        .select('*')
        .eq('order_id', orderId)
        .eq('status', 'active');

    if (reservations) {
        for (const res of reservations) {
            // Release reserved stock
            await supabase
                .from('products')
                .update({
                    reserved_stock: supabase.rpc('decrement_reserved_stock', {
                        p_product_id: res.product_id,
                        p_quantity: res.quantity
                    })
                })
                .eq('id', res.product_id);

            // Mark reservation as released
            await supabase
                .from('stock_reservations')
                .update({ status: 'released' })
                .eq('id', res.id);
        }
    }
}
