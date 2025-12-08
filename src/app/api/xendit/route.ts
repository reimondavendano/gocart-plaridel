import { NextResponse } from 'next/server';

// Xendit Webhook Handler for payment verification
// In production, would verify webhook signature and update order status

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { external_id, status, paid_amount, payment_method } = body;

        // Verify webhook signature (in production)
        // const signature = request.headers.get('x-callback-token');
        // if (signature !== process.env.XENDIT_WEBHOOK_TOKEN) {
        //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        // }

        console.log('Xendit Webhook Received:', {
            external_id,
            status,
            paid_amount,
            payment_method,
        });

        // Handle different payment statuses
        switch (status) {
            case 'PAID':
                // Update order status to paid
                // await updateOrderStatus(external_id, 'paid');
                // Clear user's cart
                // await clearUserCart(userId);
                console.log(`Order ${external_id} marked as PAID`);
                break;

            case 'EXPIRED':
                // Update order status to expired/cancelled
                // await updateOrderStatus(external_id, 'cancelled');
                console.log(`Order ${external_id} payment EXPIRED`);
                break;

            case 'FAILED':
                // Update order status to failed
                // await updateOrderStatus(external_id, 'failed');
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
        // Still return 200 to prevent retries for processing errors
        return NextResponse.json({
            received: true,
            error: 'Processing error',
        });
    }
}
