import { NextRequest, NextResponse } from 'next/server';
import { getOrderById } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let order: any;
    try {
      order = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Wait 10 seconds to allow Shopify Flow to add tags
    await new Promise((resolve) => setTimeout(resolve, 10_000));

    // Try to refetch order to capture tags added by Flow
    let finalOrder: any = order;
    if (order?.id) {
      try {
        const fetched = await getOrderById(order.id);
        if (fetched) {
          finalOrder = fetched;
        }
      } catch (e) {
        console.warn('orders/create: refetch failed, using original payload');
      }
    }

    // Ensure tags is a string, use tags-only mapping downstream
    if (Array.isArray(finalOrder?.tags)) {
      finalOrder.tags = finalOrder.tags.join(',');
    }
    finalOrder.tags = String(finalOrder?.tags || '');

    // Forward to the orders/updated handler which performs shipping routing
    const target = new URL('/api/shopify/webhooks/orders/updated', request.nextUrl);
    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(finalOrder),
    });

    const json = await res.json().catch(() => ({ ok: res.ok }));
    return NextResponse.json(json, { status: res.status });
  } catch (error: any) {
    console.error('Shopify orders/create webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
