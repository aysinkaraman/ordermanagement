import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import crypto from 'crypto'; // TEMPORARILY DISABLED FOR DEBUGGING

// Default column names (shipping types)
const DEFAULT_COLUMNS = ['Priority', 'Express', 'Ground', 'Pickup'];

// TEMPORARILY DISABLED FOR DEBUGGING
/*
function verifyShopifyWebhook(body: string, hmacHeader: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  return hash === hmacHeader;
}
*/

// POST - Webhook endpoint for new orders
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256');
    
    console.log('🔐 Webhook received - HMAC present:', !!hmacHeader);
    console.log('🔐 Webhook secret configured:', !!process.env.SHOPIFY_WEBHOOK_SECRET);
    console.log('🌍 Environment:', process.env.NODE_ENV);
    
    // Verify webhook authenticity in production
    // TEMPORARILY DISABLED FOR DEBUGGING
    /*
    if (process.env.NODE_ENV === 'production' && hmacHeader) {
      const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
      if (webhookSecret && !verifyShopifyWebhook(rawBody, hmacHeader, webhookSecret)) {
        console.error('Webhook verification failed');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    */

    const order = JSON.parse(rawBody);
    console.log('📦 New order webhook received:', order.order_number);

    // Determine target column based on tags ONLY (ignore shipping lines)
    let targetColumn = 'Ground'; // default
    let foundTag = false;
    
    // Parse tags
    let tags: string[] = [];
    if (order.tags && typeof order.tags === 'string') {
      tags = order.tags.toLowerCase().split(',').map((t: string) => t.trim());
      console.log('🏷️ Raw tags string:', order.tags);
      console.log('🏷️ Parsed tags array:', tags);
    }
    
    // Check tags ONLY - priority has highest precedence, stop after first match
    for (const tag of tags) {
      if (tag.includes('priority')) {
        targetColumn = 'Priority';
        foundTag = true;
        console.log('🔥 Priority order detected from tag:', tag, '- STOPPING here, ignoring other tags');
        break;
      } else if (tag.includes('express')) {
        targetColumn = 'Express';
        foundTag = true;
        console.log('⚡ Express order detected from tag:', tag, '- STOPPING here');
        break;
      } else if (tag.includes('ground') || tag.includes('shipping')) {
        targetColumn = 'Ground';
        foundTag = true;
        console.log('🚚 Ground order detected from tag:', tag, '- STOPPING here');
        break;
      } else if (tag.includes('pickup') || tag.includes('shop location')) {
        targetColumn = 'Pickup';
        foundTag = true;
        console.log('📍 Pickup order detected from tag:', tag, '- STOPPING here');
        break;
      }
    }
    
    if (!foundTag) {
      console.log('⚠️ No matching tag found, using default: Ground');
    }
    
    console.log('✅ Final target column:', targetColumn);

    // Use the FIRST available board (user's main board)
    let board = await prisma.board.findFirst({
      include: { columns: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' }
    });

    // If no board exists at all, create one
    if (!board) {
      console.log('📋 No boards found, creating first board');
      
      // Get first user as owner
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json({ error: 'No users found' }, { status: 500 });
      }

      board = await prisma.board.create({
        data: {
          title: 'Falcon Board',
          ownerId: firstUser.id,
          columns: {
            create: DEFAULT_COLUMNS.map((title, index) => ({
              title,
              order: index,
            }))
          }
        },
        include: { columns: { orderBy: { order: 'asc' } } }
      });
    }
    
    console.log('📋 Using board:', board.title, '(ID:', board.id, ')');
    console.log('📋 Board columns:', board.columns.map(c => c.title).join(', '));

    // Get target column
    const column = board.columns.find(c => c.title === targetColumn);
    
    if (!column) {
      console.error(`❌ Column "${targetColumn}" not found in board`);
      return NextResponse.json({ error: `Column ${targetColumn} not found` }, { status: 500 });
    }
    
    console.log('✅ Using column:', column.title, '(ID:', column.id, ')');

    // Check if order already exists
    const existingCard = await prisma.card.findFirst({
      where: {
        title: { contains: `#${order.order_number}` },
      },
    });

    if (existingCard) {
      console.log('⚠️ Order already exists:', order.order_number);
      return NextResponse.json({ message: 'Order already exists', cardId: existingCard.id });
    }

    // Get max order for position
    const maxOrderCard = await prisma.card.findFirst({
      where: { columnId: column.id },
      orderBy: { order: 'desc' },
    });

    // Prepare order details
    const customerName = order.customer 
      ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim()
      : 'Guest Customer';

    const shippingInfo = order.shipping_lines?.[0]?.title || 'N/A';

    const orderDetails = `
📦 Order #${order.order_number}
👤 Customer: ${customerName}
💰 Total: ${order.currency} ${order.total_price}
🚚 Shipping: ${targetColumn} (${shippingInfo})
📅 Date: ${new Date(order.created_at).toLocaleDateString()}
📧 Email: ${order.email || 'N/A'}
📱 Phone: ${order.phone || 'N/A'}
🏷️ Tags: ${order.tags || 'None'}

Items:
${order.line_items.map((item: any) => `- ${item.quantity}x ${item.name} (${order.currency} ${item.price})`).join('\n')}

Shipping Address:
${order.shipping_address ? `
${order.shipping_address.address1 || ''}
${order.shipping_address.city || ''}, ${order.shipping_address.province || ''} ${order.shipping_address.zip || ''}
${order.shipping_address.country || ''}
`.trim() : 'N/A'}
    `.trim();

    // Create card
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
        message: `Order automatically imported from Shopify to ${targetColumn} column`,
      },
    });

    console.log('✅ Order imported to column:', targetColumn, '- Card ID:', card.id);

    return NextResponse.json({
      success: true,
      cardId: card.id,
      boardTitle: board.title,
      column: targetColumn,
      message: 'Order imported successfully',
    });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
