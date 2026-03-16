import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapShipping } from '@/lib/shopify';

// HMAC verification removed; this route processes requests without signature checks.

// Standup board logic removed per requirement; only shipping board is handled.

async function ensureFalconBoard(): Promise<{ id: string; title: string } | null> {
  const title = 'Falcon Board';
  // Try to find existing Falcon board by title
  let board = await prisma.board.findFirst({ where: { title: { contains: 'Falcon', mode: 'insensitive' } }, select: { id: true, title: true, ownerId: true } });
  if (board) return { id: board.id, title: board.title };
  // Create if missing, using configured owner or first user as fallback
  const ownerEmail = process.env.FALCON_OWNER_EMAIL || process.env.STANDUP_OWNER_EMAIL || '';
  let ownerId: string | null = null;
  if (ownerEmail) {
    const owner = await prisma.user.findUnique({ where: { email: ownerEmail }, select: { id: true } });
    if (owner) ownerId = owner.id;
  }
  if (!ownerId) {
    const first = await prisma.user.findFirst({ select: { id: true } });
    if (first) ownerId = first.id;
  }
  if (!ownerId) return null;
  const created = await prisma.board.create({ data: { title, isPublic: false, ownerId }, select: { id: true, title: true } });
  return created;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    // HMAC verification disabled: process all incoming webhooks without signature check.

    const payload = JSON.parse(rawBody);
    const order = payload;
    // Robustly resolve order number from various Shopify fields
    const resolveOrderNumber = (o: any) => {
      const raw = o?.order_number ?? o?.name ?? o?.number ?? null;
      if (typeof raw === 'number' && Number.isFinite(raw)) return { num: raw, display: `#${raw}` };
      if (typeof raw === 'string') {
        // Shopify often provides name like "#1234"; strip non-digits for numeric, keep original for display
        const digits = raw.replace(/[^0-9]/g, '');
        const num = digits ? parseInt(digits, 10) : null;
        const display = raw.startsWith('#') ? raw : (num !== null ? `#${num}` : (raw || ''));
        return { num, display };
      }
      return { num: null, display: `#${o?.id ?? 'unknown'}` };
    };
    const { num: orderNumber, display: orderNumberDisplay } = resolveOrderNumber(order);
    const tagsStr: string = String(order.tags || '');
    const tags = tagsStr.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

    // Only use tags for shipping-based routing (ignore shipping_lines.title)

    // 1) Shipping → Falcon Board (always handle shipping based on tags)
    const shippingColumnName = mapShipping(tagsStr);
    const falconBoardId = process.env.SHOPIFY_FALCON_BOARD_ID || null;
    let falconBoard = falconBoardId
      ? await prisma.board.findUnique({ where: { id: falconBoardId }, select: { id: true, title: true } })
      : await prisma.board.findFirst({ where: { title: { contains: 'Falcon', mode: 'insensitive' } }, select: { id: true, title: true } });
    if (!falconBoard) {
      falconBoard = await ensureFalconBoard();
    }
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
        where: { title: { contains: `${orderNumberDisplay}` }, column: { boardId: falconBoard.id } },
        include: { column: true },
      });
      if (existingShippingCard) {
        const protectedCols = ['Done', 'Is Being Made', 'Email Will Send', 'Email Sent'];
        const isProtected = protectedCols.includes(String(existingShippingCard.column.title).trim());
        const currentTitle = String(existingShippingCard.column.title || '').trim();
        const currentIsShipping = allowedLower.includes(currentTitle.toLowerCase());
          if (!isProtected && currentIsShipping && existingShippingCard.columnId !== shippingCol.id) {
            const maxOrderCardForTarget = await prisma.card.findFirst({ where: { columnId: shippingCol.id }, orderBy: { order: 'desc' } });
            const nextOrderForTarget = (maxOrderCardForTarget?.order ?? -1) + 1;
            const moved = await prisma.card.update({ where: { id: existingShippingCard.id }, data: { columnId: shippingCol.id, order: nextOrderForTarget } });
            await prisma.activity.create({ data: { cardId: moved.id, message: `Webhook: moved to ${shippingColumnName} by shipping tag (placed at bottom)` } });
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
          const orderDetails = `\n🚚 Shipping: ${shippingColumnName}\n📦 Order ${orderNumberDisplay}\n👤 Customer: ${customerName}\n💰 Total: ${order.currency} ${order.total_price}\n📅 Date: ${new Date(order.created_at).toLocaleString()}\nTags: ${tags.join(', ')}`;
          const card = await prisma.card.create({
            data: {
              columnId: shippingCol.id,
              title: `🚚 ${shippingColumnName} · ${orderNumberDisplay}`,
              description: orderDetails,
              order: (maxOrderCard?.order ?? -1) + 1,
              labels: ['shipping', shippingColumnName.toLowerCase(), 'shopify', `order:${order.id}`],
            },
          });
          await prisma.activity.create({ data: { cardId: card.id, message: `Webhook: created in ${shippingColumnName}` } });
        } else {
          // Skip creation for non-shipping lists; log only
          console.info(`Webhook: skipped create (non-shipping list ${shippingColumnName}) for order #${orderNumber}`);
        }
      }
    }

    // Designer/standup handling removed. Return after shipping processing.
    return NextResponse.json({ success: true, shippingHandled: !!falconBoard });
  } catch (error: any) {
    console.error('Shopify orders/updated webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
