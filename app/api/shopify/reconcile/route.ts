import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mapShipping, getOrderById } from '@/lib/shopify';

export const runtime = 'edge';
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';

// Reconcile late-arriving designer/shipping tags by refetching Shopify orders
// Usage: GET /api/shopify/reconcile?limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const cards = await prisma.card.findMany({
      where: { labels: { has: 'shopify' } },
      orderBy: { updatedAt: 'desc' },
      take: Math.max(1, Math.min(200, limit)),
      include: { column: { include: { board: true } } },
    });

    const results: any[] = [];

    for (const card of cards) {
      const orderLabel = (card.labels || []).find(l => l.startsWith('order:'));
      if (!orderLabel) continue;
      const orderId = orderLabel.split(':')[1];
      const order = await getOrderById(orderId);
      if (!order) {
        results.push({ cardId: card.id, status: 'skip', reason: 'order not found' });
        continue;
      }

      const tagsStr: string = String(order.tags || '');
      const shippingTitle: string = String(order.shipping_lines?.[0]?.title || '');
      const tags = tagsStr.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

      // Shipping → Falcon board
      const boardTitle = card.column?.board?.title || '';
        if (boardTitle.toLowerCase().includes('falcon')) { 
          const allowedShipping = ['Ground', 'Pickup', 'Express', 'Priority'];
          const allowedLower = allowedShipping.map((s) => s.toLowerCase());
          const protectedCols = ['Done', 'Is Being Made'];
          const isProtected = protectedCols.includes(String(card.column.title || '').trim());
          if (isProtected) {
            await prisma.activity.create({ data: { cardId: card.id, message: `Reconcile: skipped (protected column ${card.column.title})` } });
            results.push({ cardId: card.id, action: 'skip-shipping', reason: 'protected' });
            continue;
          }
        const desiredColName = mapShipping(`${tagsStr} ${shippingTitle}`.trim());
          // Only auto-move/create for allowed shipping lists
          if (!allowedLower.includes(desiredColName.toLowerCase())) {
            results.push({ cardId: card.id, action: 'skip-shipping', reason: 'non-shipping-list', desired: desiredColName });
            continue;
          }
          const currentTitle = String(card.column.title || '').trim();
          if (!allowedLower.includes(currentTitle.toLowerCase())) {
            await prisma.activity.create({ data: { cardId: card.id, message: `Reconcile: skipped (current list is non-shipping: ${currentTitle})` } });
            results.push({ cardId: card.id, action: 'skip-shipping', reason: 'current-non-shipping', current: currentTitle });
            continue;
          }
        let destCol = await prisma.column.findFirst({ where: { boardId: card.column.boardId, title: desiredColName } });
        if (!destCol) {
          const colCount = await prisma.column.count({ where: { boardId: card.column.boardId } });
          destCol = await prisma.column.create({ data: { title: desiredColName, order: colCount, boardId: card.column.boardId } });
        }
        if (card.columnId !== destCol.id) {
          await prisma.card.update({ where: { id: card.id }, data: { columnId: destCol.id } });
          await prisma.activity.create({ data: { cardId: card.id, message: `Reconcile: moved to ${desiredColName}` } });
          results.push({ cardId: card.id, action: 'move-shipping', to: desiredColName });
        } else {
          results.push({ cardId: card.id, action: 'noop-shipping' });
        }
      }

      // Designer → Standup board
        if (boardTitle.toLowerCase().includes('standup')) { 
          const protectedCols = ['Done', 'Is Being Made'];
          const isProtected = protectedCols.includes(String(card.column.title || '').trim());
          if (isProtected) {
            await prisma.activity.create({ data: { cardId: card.id, message: `Reconcile: skipped (protected column ${card.column.title})` } });
            results.push({ cardId: card.id, action: 'skip-designer', reason: 'protected' });
            continue;
          }
        const TAG_MAP: Record<string, string> = JSON.parse(process.env.STANDUP_TAG_MAP || '{}');
        let designer: string | null = null;
        for (const t of tags) {
          const d = TAG_MAP[t];
          if (d) { designer = d; break; }
        }
        if (designer) {
          let destCol = await prisma.column.findFirst({ where: { boardId: card.column.boardId, title: designer } });
          if (!destCol) {
            const colCount = await prisma.column.count({ where: { boardId: card.column.boardId } });
            destCol = await prisma.column.create({ data: { title: designer, order: colCount, boardId: card.column.boardId } });
          }
          if (card.columnId !== destCol.id) {
            await prisma.card.update({ where: { id: card.id }, data: { columnId: destCol.id } });
            await prisma.activity.create({ data: { cardId: card.id, message: `Reconcile: moved to ${designer}` } });
            results.push({ cardId: card.id, action: 'move-designer', to: designer });
          } else {
            results.push({ cardId: card.id, action: 'noop-designer' });
          }
        } else {
          results.push({ cardId: card.id, action: 'noop-designer', reason: 'no designer tag yet' });
        }
      }
    }

    return NextResponse.json({ ok: true, count: results.length, results });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || 'failed' }, { status: 500 });
  }
}
