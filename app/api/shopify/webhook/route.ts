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

    // Check if important tags exist (priority, express, shop location, shipping)
    // If not, wait 10 seconds for Shopify Flow to add them
    let finalOrder = order;
    const initialTags = (order.tags || '').toLowerCase();
    const hasImportantTags = initialTags.includes('priority') || 
                             initialTags.includes('express') || 
                             initialTags.includes('shop') || 
                             initialTags.includes('pickup') ||
                             initialTags.includes('shipping');
    
    if (!hasImportantTags) {
      console.log('⏳ No important tags found, waiting 10 seconds for Shopify Flow...');
      console.log('📝 Initial tags were:', order.tags);
      
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Re-fetch order from Shopify API to get updated tags
      try {
        const shopifyUrl = `https://${process.env.SHOPIFY_SHOP_NAME}/admin/api/2024-01/orders/${order.id}.json`;
        const response = await fetch(shopifyUrl, {
          headers: {
            'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN || '',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          finalOrder = data.order;
          console.log('✅ Re-fetched order from Shopify. New tags:', finalOrder.tags);
        } else {
          console.log('⚠️ Could not re-fetch order, using original');
        }
      } catch (e) {
        console.log('⚠️ Error re-fetching order:', e);
      }
    } else {
      console.log('✅ Important tags already present, no need to wait');
    }
    
    // Normalize entire tag string to lowercase for matching
    const tagString = (finalOrder.tags || '').toLowerCase();
    
    console.log('🏷️ RAW tag string:', finalOrder.tags);
    console.log('🏷️ Normalized:', tagString);
    
    // Determine target column by checking the ENTIRE tag string
    let targetColumn: string;
    
    if (tagString.includes('priority')) {
      targetColumn = 'Priority';
      console.log('🔥 Found "priority" in tags → Priority list');
    } else if (tagString.includes('express')) {
      targetColumn = 'Express';
      console.log('⚡ Found "express" in tags → Express list');
    } else if (tagString.includes('shop location') || tagString.includes('shop') || tagString.includes('pickup')) {
      targetColumn = 'Pickup';
      console.log('📍 Found shop/pickup tag in tags → Pickup list');
    } else if (
      tagString.includes('shipping') || 
      tagString.includes('ground shipping') || 
      tagString.includes('free ground shipping')
    ) {
      targetColumn = 'Ground';
      console.log('🚚 Found shipping-related tag → Ground list');
    } else {
      targetColumn = 'Ground';
      console.log('⚠️ No recognized tags, using default → Ground list');
    }
    
    console.log('✅ FINAL ASSIGNMENT:', targetColumn);

    // Always use the first available board - simpler and more reliable
    console.log('📋 Finding first available board...');
    const board = await prisma.board.findFirst({
      include: { columns: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'asc' }
    });

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
      include: {
        column: true
      }
    });

    if (existingCard) {
      console.log('⚠️ Order already exists:', order.order_number);
      
      // Check if this card was created recently (within 1 minute) and in wrong column
      const createdRecently = new Date().getTime() - new Date(existingCard.createdAt).getTime() < 1 * 60 * 1000;
      
      if (createdRecently && existingCard.column.title !== targetColumn) {
        console.log(`🔄 Card created recently in wrong column. Moving from ${existingCard.column.title} to ${targetColumn}`);
        
        await prisma.card.update({
          where: { id: existingCard.id },
          data: { columnId: column.id }
        });
        
        await prisma.activity.create({
          data: {
            cardId: existingCard.id,
            message: `Order moved from ${existingCard.column.title} to ${targetColumn} (tags arrived from Shopify Flow)`,
          },
        });
        
        return NextResponse.json({ 
          message: 'Order moved to correct column', 
          cardId: existingCard.id,
          movedFrom: existingCard.column.title,
          movedTo: targetColumn
        });
      }
      
      console.log('⏭️ Card exists and is older than 5 minutes or already in correct column - ignoring webhook');
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
