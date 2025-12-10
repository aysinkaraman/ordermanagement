import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SHOPIFY_CONFIG, SHOPIFY_ORDER_STATUS_MAP } from '@/lib/shopify';
import { getUserIdFromRequest } from '@/lib/auth';

// GET - Fetch orders from Shopify
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    
    if (!SHOPIFY_CONFIG.shopName || !SHOPIFY_CONFIG.accessToken) {
      return NextResponse.json(
        { error: 'Shopify credentials not configured' },
        { status: 400 }
      );
    }

    // Fetch orders from Shopify
    const response = await fetch(
      `https://${SHOPIFY_CONFIG.shopName}/admin/api/${SHOPIFY_CONFIG.apiVersion}/orders.json?status=any&limit=50`,
      {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_CONFIG.accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.statusText}`);
    }

    const data = await response.json();
    const orders = data.orders || [];

    // Get or create columns
    const columns = await prisma.column.findMany({
      orderBy: { order: 'asc' },
    });

    const columnMap = new Map(columns.map(col => [col.title, col.id]));
    
    // Ensure default columns exist
    const defaultColumns = ['To Do', 'In Progress', 'Done', 'Cancelled'];
    for (const colName of defaultColumns) {
      if (!columnMap.has(colName)) {
        const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order)) : -1;
        const newCol = await prisma.column.create({
          data: {
            title: colName,
            order: maxOrder + 1,
            ...(userId && { userId }),
          },
        });
        columnMap.set(colName, newCol.id);
      }
    }

    // Import orders as cards
    const imported = [];
    for (const order of orders) {
      // Check if order already exists
      const existingCard = await prisma.card.findFirst({
        where: {
          title: { contains: `#${order.order_number}` },
        },
      });

      if (existingCard) {
        continue; // Skip already imported orders
      }

      // Determine column based on order status
      const orderStatus = order.financial_status || 'pending';
      const columnName = SHOPIFY_ORDER_STATUS_MAP[orderStatus] || 'To Do';
      const columnId = columnMap.get(columnName);

      if (!columnId) continue;

      // Create card for order
      const maxOrderCard = await prisma.card.findFirst({
        where: { columnId },
        orderBy: { order: 'desc' },
      });

      const customerName = order.customer 
        ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
        : 'Guest Customer';

      const orderDetails = `
📦 Order #${order.order_number}
👤 Customer: ${customerName}
💰 Total: ${order.currency} ${order.total_price}
📅 Date: ${new Date(order.created_at).toLocaleDateString()}
📧 Email: ${order.email || 'N/A'}
📱 Phone: ${order.phone || 'N/A'}

Items:
${order.line_items.map((item: any) => `- ${item.quantity}x ${item.name} (${order.currency} ${item.price})`).join('\n')}

Shipping Address:
${order.shipping_address ? `
${order.shipping_address.address1 || ''}
${order.shipping_address.city || ''}, ${order.shipping_address.province || ''} ${order.shipping_address.zip || ''}
${order.shipping_address.country || ''}
`.trim() : 'N/A'}
      `.trim();

      const card = await prisma.card.create({
        data: {
          columnId,
          title: `🛍️ Order #${order.order_number}`,
          description: orderDetails,
          order: (maxOrderCard?.order ?? -1) + 1,
          ...(userId && { userId }),
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          cardId: card.id,
          message: `Order imported from Shopify`,
          ...(userId && { userId }),
        },
      });

      imported.push({
        orderId: order.id,
        orderNumber: order.order_number,
        cardId: card.id,
      });
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      total: orders.length,
      details: imported,
    });
  } catch (error: any) {
    console.error('Shopify import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import orders' },
      { status: 500 }
    );
  }
}

// POST - Webhook endpoint for new orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const order = body;

    // Verify webhook (in production, verify HMAC signature)
    // const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    
    // Get or create column
    const orderStatus = order.financial_status || 'pending';
    const columnName = SHOPIFY_ORDER_STATUS_MAP[orderStatus] || 'To Do';
    
    let column = await prisma.column.findFirst({
      where: { title: columnName },
    });

    if (!column) {
      const maxOrder = await prisma.column.findFirst({
        orderBy: { order: 'desc' },
      });
      column = await prisma.column.create({
        data: {
          title: columnName,
          order: (maxOrder?.order ?? -1) + 1,
        },
      });
    }

    // Check if order already exists
    const existingCard = await prisma.card.findFirst({
      where: {
        title: { contains: `#${order.order_number}` },
      },
    });

    if (existingCard) {
      return NextResponse.json({ message: 'Order already exists' });
    }

    // Create card
    const maxOrderCard = await prisma.card.findFirst({
      where: { columnId: column.id },
      orderBy: { order: 'desc' },
    });

    const customerName = order.customer 
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
      : 'Guest Customer';

    const orderDetails = `
📦 Order #${order.order_number}
👤 Customer: ${customerName}
💰 Total: ${order.currency} ${order.total_price}
📅 Date: ${new Date(order.created_at).toLocaleDateString()}
📧 Email: ${order.email || 'N/A'}
📱 Phone: ${order.phone || 'N/A'}

Items:
${order.line_items.map((item: any) => `- ${item.quantity}x ${item.name} (${order.currency} ${item.price})`).join('\n')}

Shipping Address:
${order.shipping_address ? `
${order.shipping_address.address1 || ''}
${order.shipping_address.city || ''}, ${order.shipping_address.province || ''} ${order.shipping_address.zip || ''}
${order.shipping_address.country || ''}
`.trim() : 'N/A'}
    `.trim();

    const card = await prisma.card.create({
      data: {
        columnId: column.id,
        title: `🛍️ Order #${order.order_number}`,
        description: orderDetails,
        order: (maxOrderCard?.order ?? -1) + 1,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        cardId: card.id,
        message: `Order received from Shopify webhook`,
      },
    });

    return NextResponse.json({
      success: true,
      cardId: card.id,
      message: 'Order imported successfully',
    });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
