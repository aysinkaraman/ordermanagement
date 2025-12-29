import { NextRequest, NextResponse } from 'next/server';

// Test endpoint to manually trigger webhook logic
export async function POST(request: NextRequest) {
  try {
    // Sample Shopify order payload for testing
    const testOrder = {
      id: 999999999,
      order_number: 9999,
      created_at: new Date().toISOString(),
      currency: "USD",
      total_price: "150.00",
      email: "test@example.com",
      phone: "+1234567890",
      tags: "priority, express",
      customer: {
        first_name: "Test",
        last_name: "Customer"
      },
      shipping_lines: [
        {
          title: "Priority Shipping"
        }
      ],
      line_items: [
        {
          name: "Test Product",
          quantity: 2,
          price: "75.00"
        }
      ],
      shipping_address: {
        address1: "123 Test St",
        city: "Test City",
        province: "TC",
        zip: "12345",
        country: "USA"
      }
    };

    // Call the actual orders/updated webhook endpoint with valid HMAC
    const webhookUrl = `${request.nextUrl.origin}/api/shopify/webhooks/orders/updated`;
    console.log('🧪 Testing webhook with URL:', webhookUrl);

    const body = JSON.stringify(testOrder);
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) {
      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
      headers['x-shopify-hmac-sha256'] = hmac;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body,
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      result,
      testOrder: {
        order_number: testOrder.order_number,
        tags: testOrder.tags,
      }
    });
  } catch (error: any) {
    console.error('❌ Test webhook error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
