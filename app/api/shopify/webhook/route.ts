import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import crypto from 'crypto'; // TEMPORARILY DISABLED FOR DEBUGGING

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
    console.log('🔍 RAW TAGS:', order.tags);
    console.log('🔍 TAG TYPE:', typeof order.tags);

    // Determine target column based on tags ONLY (ignore shipping lines)
    let targetColumn = 'Ground'; // default
    let foundTag = false;
    
    // Parse tags
    let tags: string[] = [];
    if (order.tags && typeof order.tags === 'string') {
      tags = order.tags.toLowerCase().split(',').map((t: string) => t.trim());
      console.log('🏷️ Raw tags string:', order.tags);
      console.log('🏷️ Raw tags LENGTH:', order.tags.length);
      console.log('🏷️ Parsed tags array:', JSON.stringify(tags));
      console.log('🏷️ Each tag with length:');
      tags.forEach((t, i) => {
        console.log(`   [${i}] "${t}" (length: ${t.length}, bytes: [${Array.from(t).map(c => c.charCodeAt(0)).join(', ')}])`);
      });
    }
    
    // Check ALL tags first, then decide based on priority
    // Priority is only checked first, all other tags are evaluated together
    
    if (tags && tags.length > 0) {
      console.log('🏷️ Checking tags:', tags.join(', '));
      
      // Check what tags exist
      const hasPriority = tags.some(t => t.includes('priority'));
      const hasExpress = tags.some(t => t.includes('express'));
      const hasPickup = tags.some(t => t.includes('shop location') || t.includes('pickup'));
      const hasShipping = tags.some(t => t.includes('free ground shipping') || t.includes('ground shipping') || t.includes('shipping'));
      
      console.log('📊 Tag check results:', { hasPriority, hasExpress, hasPickup, hasShipping });
      
      // Apply priority rules - only Priority has precedence, rest are equal
      if (hasPriority) {
        targetColumn = 'Priority';
        foundTag = true;
        console.log('🔥 PRIORITY tag found → Priority list');
      } else if (hasExpress) {
        targetColumn = 'Express';
        foundTag = true;
        console.log('⚡ EXPRESS tag found → Express list');
      } else if (hasPickup) {
        targetColumn = 'Pickup';
        foundTag = true;
        console.log('📍 PICKUP tag found → Pickup list');
      } else if (hasShipping) {
        targetColumn = 'Ground';
        foundTag = true;
        console.log('🚚 SHIPPING tag found → Ground list');
      }
    }
    
    // If NO matching tag found, use default Ground list
    if (!foundTag) {
      console.log('⚠️ No matching tag found. Tags:', tags.length > 0 ? tags.join(', ') : 'none', '- using default: Ground');
      targetColumn = 'Ground';
    }
    
    console.log('✅ Final target column:', targetColumn);

    // Use specific board from env variable, or fallback to first board
    const targetBoardId = process.env.SHOPIFY_TARGET_BOARD_ID;
    let board;
    
    if (targetBoardId) {
      console.log('🎯 Using target board ID from env:', targetBoardId);
      board = await prisma.board.findUnique({
        where: { id: targetBoardId },
        include: { columns: { orderBy: { order: 'asc' } } }
      });
      
      if (!board) {
        console.error('❌ Target board not found:', targetBoardId, '- falling back to first board');
      }
    }
    
    // Fallback: use the first available board (user's main board)
    if (!board) {
      console.log('📋 Using first available board');
      board = await prisma.board.findFirst({
        include: { columns: { orderBy: { order: 'asc' } } },
        orderBy: { createdAt: 'asc' }
      });
    }

    // If no board exists, return error - DO NOT auto-create boards
    if (!board) {
      console.error('❌ No boards found - webhook cannot auto-create boards');
      return NextResponse.json({ 
        error: 'No target board found. Please create a board first or set SHOPIFY_TARGET_BOARD_ID environment variable.' 
      }, { status: 400 });
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

    // Get max order across ALL cards in the board (not just this column)
    // This ensures new orders always go to the bottom, in arrival order
    const maxOrderCard = await prisma.card.findFirst({
      where: { 
        column: {
          boardId: board.id
        }
      },
      orderBy: { order: 'desc' },
    });
    
    const nextOrder = (maxOrderCard?.order ?? -1) + 1;
    console.log('📊 New card will be positioned at:', nextOrder, '(current max:', maxOrderCard?.order ?? 'none', ')');

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

    // Create card - always add to bottom based on arrival time
    const card = await prisma.card.create({
      data: {
        columnId: column.id,
        title: `🛍️ Order #${order.order_number}`,
        description: orderDetails,
        order: nextOrder,
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
