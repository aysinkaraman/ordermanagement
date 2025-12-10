import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SHOPIFY_ORDER_STATUS_MAP } from '@/lib/shopify';
import { getUserIdFromRequest } from '@/lib/auth';

// POST - Create demo Shopify orders for testing
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    // Demo orders data
    const demoOrders = [
      {
        order_number: 1001,
        financial_status: 'paid',
        currency: 'USD',
        total_price: '149.99',
        created_at: new Date().toISOString(),
        email: 'john.doe@example.com',
        phone: '+1 555-0101',
        customer: {
          first_name: 'John',
          last_name: 'Doe',
        },
        line_items: [
          { quantity: 2, name: 'Premium T-Shirt', price: '29.99' },
          { quantity: 1, name: 'Designer Jeans', price: '89.99' },
        ],
        shipping_address: {
          address1: '123 Main Street',
          city: 'New York',
          province: 'NY',
          zip: '10001',
          country: 'United States',
        },
      },
      {
        order_number: 1002,
        financial_status: 'pending',
        currency: 'USD',
        total_price: '79.50',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        email: 'sarah.smith@example.com',
        phone: '+1 555-0102',
        customer: {
          first_name: 'Sarah',
          last_name: 'Smith',
        },
        line_items: [
          { quantity: 1, name: 'Wireless Headphones', price: '79.50' },
        ],
        shipping_address: {
          address1: '456 Oak Avenue',
          city: 'Los Angeles',
          province: 'CA',
          zip: '90001',
          country: 'United States',
        },
      },
      {
        order_number: 1003,
        financial_status: 'fulfilled',
        currency: 'EUR',
        total_price: '299.00',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        email: 'mike.johnson@example.com',
        phone: '+44 20 7946 0958',
        customer: {
          first_name: 'Mike',
          last_name: 'Johnson',
        },
        line_items: [
          { quantity: 1, name: 'Smart Watch Pro', price: '299.00' },
        ],
        shipping_address: {
          address1: '789 High Street',
          city: 'London',
          province: 'England',
          zip: 'SW1A 1AA',
          country: 'United Kingdom',
        },
      },
      {
        order_number: 1004,
        financial_status: 'partially_paid',
        currency: 'USD',
        total_price: '549.99',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        email: 'lisa.brown@example.com',
        phone: '+1 555-0104',
        customer: {
          first_name: 'Lisa',
          last_name: 'Brown',
        },
        line_items: [
          { quantity: 1, name: 'Laptop Stand', price: '49.99' },
          { quantity: 1, name: 'Mechanical Keyboard', price: '149.99' },
          { quantity: 1, name: '4K Monitor', price: '349.99' },
        ],
        shipping_address: {
          address1: '321 Tech Avenue',
          city: 'San Francisco',
          province: 'CA',
          zip: '94102',
          country: 'United States',
        },
      },
      {
        order_number: 1005,
        financial_status: 'refunded',
        currency: 'USD',
        total_price: '39.99',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        email: 'tom.wilson@example.com',
        phone: '+1 555-0105',
        customer: {
          first_name: 'Tom',
          last_name: 'Wilson',
        },
        line_items: [
          { quantity: 1, name: 'Phone Case', price: '19.99' },
          { quantity: 1, name: 'Screen Protector', price: '19.99' },
        ],
        shipping_address: {
          address1: '654 Park Lane',
          city: 'Chicago',
          province: 'IL',
          zip: '60601',
          country: 'United States',
        },
      },
    ];

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

    // Import demo orders
    const imported = [];
    for (const order of demoOrders) {
      // Check if order already exists
      const existingCard = await prisma.card.findFirst({
        where: {
          title: { contains: `#${order.order_number}` },
        },
      });

      if (existingCard) {
        continue;
      }

      // Determine column based on order status
      const orderStatus = order.financial_status || 'pending';
      const columnName = SHOPIFY_ORDER_STATUS_MAP[orderStatus] || 'To Do';
      const columnId = columnMap.get(columnName);

      if (!columnId) continue;

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

      await prisma.activity.create({
        data: {
          cardId: card.id,
          message: `Demo order imported`,
          ...(userId && { userId }),
        },
      });

      imported.push({
        orderNumber: order.order_number,
        cardId: card.id,
        status: orderStatus,
        column: columnName,
      });
    }

    return NextResponse.json({
      success: true,
      imported: imported.length,
      total: demoOrders.length,
      details: imported,
      message: '🎉 Demo orders imported successfully!',
    });
  } catch (error: any) {
    console.error('Demo import error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to import demo orders' },
      { status: 500 }
    );
  }
}
