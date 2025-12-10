import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Default column names (shipping types)
const DEFAULT_COLUMNS = ['Priority', 'Express', 'Ground', 'Pickup'];

function verifyShopifyWebhook(body: string, hmacHeader: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
  return hash === hmacHeader;
}

// POST - Webhook endpoint for new orders
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256');
    
    // Verify webhook authenticity in production
    if (process.env.NODE_ENV === 'production' && hmacHeader) {
      const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
      if (webhookSecret && !verifyShopifyWebhook(rawBody, hmacHeader, webhookSecret)) {
        console.error('Webhook verification failed');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const order = JSON.parse(rawBody);
    console.log('📦 New order webhook received:', order.order_number);

    // Determine target column based on tags and shipping type
    let targetColumn = 'Ground'; // default
    
    // Parse tags
    let tags: string[] = [];
    if (order.tags && typeof order.tags === 'string') {
      tags = order.tags.toLowerCase().split(',').map((t: string) => t.trim());
      console.log('🏷️ Order tags:', tags);
    }
    
    // 1. Check tags first (priority has highest precedence)
    if (tags.includes('priority')) {
      targetColumn = 'Priority';
      console.log('🔥 Priority order detected from tag');
    } else if (tags.includes('express')) {
      targetColumn = 'Express';
      console.log('⚡ Express order detected from tag');
    } else if (tags.includes('ground') || tags.includes('shipping')) {
      targetColumn = 'Ground';
      console.log('🚚 Ground order detected from tag');
    } else if (tags.includes('pickup')) {
      targetColumn = 'Pickup';
      console.log('📍 Pickup order detected from tag');
    }
    
    // 2. If not determined by tags, check shipping lines
    if (targetColumn === 'Ground' && order.shipping_lines && order.shipping_lines.length > 0) {
      const shippingTitle = order.shipping_lines[0].title.toLowerCase();
      const shippingCode = order.shipping_lines[0].code?.toLowerCase() || '';
      
      console.log('🚚 Shipping:', shippingTitle, '- Code:', shippingCode);
      
      if (shippingTitle.includes('express') || shippingCode.includes('express')) {
        targetColumn = 'Express';
      } else if (shippingTitle.includes('ground') || shippingTitle.includes('shipping')) {
        targetColumn = 'Ground';
      } else if (shippingTitle.includes('pickup') || shippingTitle.includes('shop location') || shippingCode.includes('pickup')) {
        targetColumn = 'Pickup';
      }
      
      console.log('📍 Target column from shipping:', targetColumn);
    }
    
    console.log('✅ Final target column:', targetColumn);

    // Get or create the main Shopify board
    const boardTitle = 'Shopify Orders';
    
    let board = await prisma.board.findFirst({
      where: { title: boardTitle },
      include: { columns: { orderBy: { order: 'asc' } } }
    });

    // Create board if doesn't exist
    if (!board) {
      console.log('📋 Creating new board:', boardTitle);
      
      // Get first user as owner
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json({ error: 'No users found' }, { status: 500 });
      }

      board = await prisma.board.create({
        data: {
          title: boardTitle,
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

    // Get target column (don't create if missing - user should create manually)
    const column = board.columns.find(c => c.title === targetColumn);
    
    if (!column) {
      return NextResponse.json({ error: `Column ${targetColumn} not found` }, { status: 500 });
    }

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
      boardTitle,
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
