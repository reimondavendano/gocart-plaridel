import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const XENDIT_API_KEY = process.env.XENDIT_SECRET_KEY;
// Use sandbox URL for development, production URL for live
const XENDIT_API_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.xendit.co/v2/invoices'
    : 'https://api.xendit.co/v2/invoices'; // Xendit uses same URL, sandbox mode is determined by API key prefix (xnd_development_*)

export async function POST(request: Request) {
    if (!XENDIT_API_KEY) {
        console.error('XENDIT_SECRET_KEY is not defined in environment variables');
        return NextResponse.json({ error: 'Payment service configuration error' }, { status: 500 });
    }

    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        // Fetch order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                user:users (
                    email
                )
            `)
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            console.error('Order fetch error:', orderError);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Fetch user profile for name/phone
        let customerName = 'Customer';
        let customerPhone = '';

        if (order.user_id) {
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('name, first_name, last_name, phone')
                .eq('user_id', order.user_id)
                .single();

            if (profile) {
                customerName = profile.name ||
                    ((profile.first_name || profile.last_name)
                        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                        : 'Customer');
                customerPhone = profile.phone || '';
            }
        }

        // Check if invoice already exists
        if (order.xendit_invoice_id) {
            return NextResponse.json({
                invoiceUrl: order.xendit_invoice_url,
                invoiceId: order.xendit_invoice_id
            });
        }

        // Create Xendit invoice
        const invoicePayload = {
            external_id: orderId,
            amount: Number(order.total),
            payer_email: order.user?.email || 'customer@example.com',
            description: `Order #${orderId.slice(0, 8).toUpperCase()}`,
            invoice_duration: 86400, // 24 hours
            currency: 'PHP',
            customer: {
                given_names: customerName,
                email: order.user?.email,
                ...(customerPhone ? { mobile_number: customerPhone } : {})
            },
            success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?payment=success`,
            failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}?payment=failed`,
        };

        const xenditResponse = await fetch(XENDIT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(XENDIT_API_KEY + ':').toString('base64')}`
            },
            body: JSON.stringify(invoicePayload)
        });

        if (!xenditResponse.ok) {
            const errorData = await xenditResponse.json();
            console.error('Xendit API Error:', JSON.stringify(errorData, null, 2));
            console.error('Sent Payload:', JSON.stringify(invoicePayload, null, 2));
            return NextResponse.json({ error: 'Failed to create invoice', details: errorData }, { status: 500 });
        }

        const invoice = await xenditResponse.json();

        // Update order with invoice details
        await supabase
            .from('orders')
            .update({
                xendit_invoice_id: invoice.id,
                xendit_invoice_url: invoice.invoice_url,
                payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

        // Create payment transaction record
        await supabase.from('payment_transactions').insert({
            order_id: orderId,
            payment_method: 'xendit',
            xendit_invoice_id: invoice.id,
            amount: order.total,
            status: 'pending'
        });

        return NextResponse.json({
            invoiceUrl: invoice.invoice_url,
            invoiceId: invoice.id,
            expiryDate: invoice.expiry_date
        });

    } catch (error) {
        console.error('Error creating Xendit invoice:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
