import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapShipping } from '@/lib/shopify';

type TagMap = Record<string, string>;

const DEFAULT_TAG_MAP: TagMap = {
  yavuz: 'Yavuz',
  sude: 'Sude',
  gorkem: 'Gorkem',
  ebrar: 'Ebrar',
  busra: 'Busra',
  sabiha: 'Sabiha',
  gulcehre: 'Gulcehre',
  reyhan: 'Reyhan',
};

function parseTagMap(): TagMap {
  const raw = process.env.STANDUP_TAG_MAP || '';
  if (!raw) return { ...DEFAULT_TAG_MAP };
  try {
    const obj = JSON.parse(raw);
    if (Array.isArray(obj)) {
      return Object.fromEntries(
        obj.map((x: any) => [String(x.tag || x.key).toLowerCase().trim(), String(x.designer || x.value)])
      );
    }
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [String(k).toLowerCase().trim(), String(v as any)])
    );
  } catch {
    return { ...DEFAULT_TAG_MAP };
  }
}

function verifyShopifyHmac(body: string, hmacHeader?: string | null): boolean {
  try {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET || '';
    if (!secret || !hmacHeader) return false;
    const crypto = require('crypto');
    const digest = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    // Timing-safe compare
    const a = Buffer.from(digest);
    const b = Buffer.from(hmacHeader);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function ensureStandupBoard(ownerId?: string) {
  const title = 'Daily Standup';
  let board = await prisma.board.findFirst({ where: { title }, select: { id: true, title: true, ownerId: true } });
  if (!board && ownerId) {
    board = await prisma.board.create({ data: { title, isPublic: false, ownerId }, select: { id: true, title: true, ownerId: true } });
  }
  return board;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
    if (!verifyShopifyHmac(rawBody, hmacHeader)) {
      return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const order = payload;
    const orderNumber: number = order.order_number;
    const tagsStr: string = String(order.tags || '');
    const shippingTitle: string = String(order.shipping_lines?.[0]?.title || '');
    const tags = tagsStr.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

    const tagMap = parseTagMap();
    const designer = (() => {
      for (const t of tags) {
        if (tagMap[t]) return tagMap[t];
      }
      return null;
    })();

    // 1) Shipping → Falcon Board (always handle shipping based on tags)
    const shippingColumnName = mapShipping(`${tagsStr} ${shippingTitle}`.trim());
    const falconBoardId = process.env.SHOPIFY_FALCON_BOARD_ID || null;
    const falconBoard = falconBoardId
      ? await prisma.board.findUnique({ where: { id: falconBoardId }, select: { id: true, title: true } })
      : await prisma.board.findFirst({ where: { title: { contains: 'Falcon', mode: 'insensitive' } }, select: { id: true, title: true } });
    if (falconBoard) {
      const allowedShipping = ['Ground', 'Pickup', 'Express', 'Priority'];
      const allowedLower = allowedShipping.map((s) => s.toLowerCase());
      // Ensure shipping column exists
      let shippingCol = await prisma.column.findFirst({ where: { boardId: falconBoard.id, title: shippingColumnName } });
      if (!shippingCol) {
        const colCount = await prisma.column.count({ where: { boardId: falconBoard.id } });
        shippingCol = await prisma.column.create({ data: { title: shippingColumnName, order: colCount, boardId: falconBoard.id } });
      }
      // Find existing card by order number across Falcon board
      const existingShippingCard = await prisma.card.findFirst({
        where: { title: { contains: `#${orderNumber}` }, column: { boardId: falconBoard.id } },
        include: { column: true },
      });
      if (existingShippingCard) {
        const protectedCols = ['Done', 'Is Being Made', 'Email Will Send', 'Email Sent'];
        const isProtected = protectedCols.includes(String(existingShippingCard.column.title).trim());
        const currentTitle = String(existingShippingCard.column.title || '').trim();
        const currentIsShipping = allowedLower.includes(currentTitle.toLowerCase());
        if (!isProtected && currentIsShipping && existingShippingCard.columnId !== shippingCol.id) {
          const moved = await prisma.card.update({ where: { id: existingShippingCard.id }, data: { columnId: shippingCol.id } });
          await prisma.activity.create({ data: { cardId: moved.id, message: `Webhook: moved to ${shippingColumnName} by shipping tag` } });
        } else if (isProtected) {
          // Respect manual moves into protected columns
          await prisma.activity.create({ data: { cardId: existingShippingCard.id, message: `Webhook: skipped move (protected column ${existingShippingCard.column.title})` } });
        } else if (!currentIsShipping) {
          // Respect manual moves into non-shipping lists
          await prisma.activity.create({ data: { cardId: existingShippingCard.id, message: `Webhook: skipped move (non-shipping list ${existingShippingCard.column.title})` } });
        }
      } else {
        // Only auto-create in allowed shipping lists
        if (allowedLower.includes(shippingColumnName.toLowerCase())) {
          const maxOrderCard = await prisma.card.findFirst({ where: { columnId: shippingCol.id }, orderBy: { order: 'desc' } });
          const customerName = order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 'Guest Customer';
          const orderDetails = `\n🚚 Shipping: ${shippingColumnName}\n📦 Order #${orderNumber}\n👤 Customer: ${customerName}\n💰 Total: ${order.currency} ${order.total_price}\n📅 Date: ${new Date(order.created_at).toLocaleString()}\nTags: ${tags.join(', ')}`;
          const card = await prisma.card.create({
            data: {
              columnId: shippingCol.id,
              title: `🚚 ${shippingColumnName} · #${orderNumber}`,
              description: orderDetails,
              order: (maxOrderCard?.order ?? -1) + 1,
              labels: ['shipping', shippingColumnName.toLowerCase(), 'shopify', `order:${order.id}`],
            },
          });
          await prisma.activity.create({ data: { cardId: card.id, message: `Webhook: created in ${shippingColumnName}` } });
        } else {
          await prisma.activity.create({ data: { message: `Webhook: skipped create (non-shipping list ${shippingColumnName})`, cardId: undefined as any } });
        }
      }
    }

    // 2) Designer → Standup Board (toggleable; only if we detect a designer tag)
    const standupAutoEnabled = (process.env.STANDUP_AUTO_ENABLED || 'true').toLowerCase() !== 'false';
    if (!standupAutoEnabled) {
      return NextResponse.json({ success: true, shippingHandled: !!falconBoard, skippedDesigner: true, reason: 'Standup auto disabled' });
    }
    if (!designer) {
      return NextResponse.json({ success: true, shippingHandled: !!falconBoard, skippedDesigner: true, reason: 'No designer tag' });
    }

    // Ensure Standup board and columns exist
    const board = await ensureStandupBoard();
    if (!board) {
      return NextResponse.json({ error: 'Standup board not found' }, { status: 404 });
    }

    const existingCols = await prisma.column.findMany({ where: { boardId: board.id }, orderBy: { order: 'asc' } });
    let maxOrder = existingCols.length > 0 ? Math.max(...existingCols.map(c => c.order)) : -1;
    const colByName = new Map(existingCols.map(c => [c.title, c]));
    if (!colByName.has(designer)) {
      const col = await prisma.column.create({ data: { title: designer, order: ++maxOrder, boardId: board.id } });
      colByName.set(designer, col);
    }
    const targetCol = colByName.get(designer)!;

    // Find existing card by order number across Standup columns
    const existingCard = await prisma.card.findFirst({
      where: {
        title: { contains: `#${orderNumber}` },
        column: { boardId: board.id },
      },
      include: { column: true },
    });

    if (existingCard) {
      const protectedCols = ['Done', 'Is Being Made'];
      const isProtected = protectedCols.includes(String(existingCard.column.title).trim());
      // If already in correct column, do nothing (idempotent)
      if (existingCard.columnId === targetCol.id) {
        return NextResponse.json({ success: true, shippingHandled: !!falconBoard, updated: false, reason: 'Already in correct column' });
      }
      // Move card to target designer column (only once upon tag change)
      if (isProtected) {
        await prisma.activity.create({ data: { cardId: existingCard.id, message: `Webhook: skipped designer move (protected column ${existingCard.column.title})` } });
        return NextResponse.json({ success: true, shippingHandled: !!falconBoard, moved: false, reason: 'Protected column' });
      }
      const moved = await prisma.card.update({ where: { id: existingCard.id }, data: { columnId: targetCol.id } });
      await prisma.activity.create({ data: { cardId: moved.id, message: `Webhook: moved to ${designer} on tag update` } });
      return NextResponse.json({ success: true, shippingHandled: !!falconBoard, moved: true, cardId: moved.id });
    }

    // Create new card if none exists yet
    const maxOrderCard = await prisma.card.findFirst({ where: { columnId: targetCol.id }, orderBy: { order: 'desc' } });
    const customerName = order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 'Guest Customer';
    const orderDetails = `\n🧑‍🎨 Designer: ${designer}\n📦 Order #${orderNumber}\n👤 Customer: ${customerName}\n💰 Total: ${order.currency} ${order.total_price}\n📅 Date: ${new Date(order.created_at).toLocaleString()}\nTags: ${tags.join(', ')}`;
    const card = await prisma.card.create({
      data: {
        columnId: targetCol.id,
        title: `🧑‍🎨 ${designer} · #${orderNumber}`,
        description: orderDetails,
        order: (maxOrderCard?.order ?? -1) + 1,
        labels: ['standup', `designer:${designer.toLowerCase()}`, 'shopify', `order:${order.id}`],
      },
    });
    await prisma.activity.create({ data: { cardId: card.id, message: `Webhook: created for ${designer}` } });
    return NextResponse.json({ success: true, shippingHandled: !!falconBoard, created: true, cardId: card.id });
  } catch (error: any) {
    console.error('Shopify orders/updated webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
