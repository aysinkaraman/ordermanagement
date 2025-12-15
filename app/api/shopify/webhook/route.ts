import { NextRequest, NextResponse } from 'next/server';

// Minimal stub: legacy webhook disabled. Use /api/shopify/webhooks/orders/updated instead.
export async function POST(_request: NextRequest) {
  return NextResponse.json({ ok: true, note: 'legacy webhook disabled; use /api/shopify/webhooks/orders/updated' });
}

export const runtime = 'edge';
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';

/*
import { prisma } from '@/lib/prisma';
import { normalizeTags, mapShipping, findDesigner } from '@/lib/shopify';
// import crypto from 'crypto';

// function verifyShopifyWebhook(body: string, hmacHeader: string, secret: string): boolean {
//   const hash = crypto
//     .createHmac('sha256', secret)
//     .update(body, 'utf8')
//     .digest('base64');
//   return hash === hmacHeader;
// }

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    // const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256') || '';

    // In production you can enable HMAC verification
    // if (process.env.NODE_ENV === 'production') {
    // (legacy code continues)
    //   const secret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
    //   if (!secret || !verifyShopifyWebhook(rawBody, hmacHeader, secret)) {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //   }
    // }

    let order: any;
    try {
      order = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Poll Shopify up to 3 times (5s apart) for tags that may arrive via Flow
    let finalOrder: any = order;
    const fetchUpdated = async () => {
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
        labels: ['shipping', targetColumn.toLowerCase()]

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

    // Designer routing to Daily Standup
    const whitelist = (process.env.SHOPIFY_DESIGNERS || '').split(',').map(s => s.trim());
    const designer = findDesigner(tags, vendors, whitelist);
    if (designer) {
      const standupBoardId = process.env.SHOPIFY_STANDUP_BOARD_ID || null;
      const standupBoard = standupBoardId
        ? await prisma.board.findUnique({ where: { id: standupBoardId }, select: { id: true, title: true, columns: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } } } })
        : await prisma.board.findFirst({ where: { title: { contains: 'Standup', mode: 'insensitive' } }, select: { id: true, title: true, columns: { select: { id: true, title: true, order: true }, orderBy: { order: 'asc' } } } });
      if (standupBoard) {
        // Ensure a default column exists
        const col = standupBoard.columns[0] || await prisma.column.create({ data: { title: 'Notes', order: 0, boardId: standupBoard.id } });
        const dateStr = new Date().toISOString().slice(0, 10);
        const title = `Daily: ${designer} — ${dateStr}`;
        const existing = await prisma.card.findFirst({ where: { columnId: col.id, title } });
        const line = `#${order.order_number} • ${order.currency} ${order.total_price} • ${order.line_items?.length || 0} items`;
        if (existing) {
          // If order already listed, skip; else append
          const already = (existing.description || '').includes(`#${order.order_number}`);
          if (!already) {
            await prisma.card.update({ where: { id: existing.id }, data: { description: `${existing.description || ''}\n${line}` } });
          }
        } else {
          await prisma.card.create({ data: { columnId: col.id, title, description: line, order: 0, labels: ['daily', `designer:${designer.toLowerCase()}`] } });
        }
      }
    }

Items:
${order.line_items.map((item: any) => `- ${item.quantity}x ${item.name} (${order.currency} ${item.price})`).join('\n')}

Shipping Address:
${order.shipping_address ? `
${order.shipping_address.address1 || ''}
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

*/
