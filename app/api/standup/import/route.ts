import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';
import { SHOPIFY_CONFIG } from '@/lib/shopify';

type TagMap = Record<string, string>; // tag -> designer name (column title)

// Default mapping if env is not provided
const DEFAULT_TAG_MAP: TagMap = {
  gorkem: 'Gorkem',
  reyhan: 'Reyhan',
  gulcehre: 'Gulcehre',
  ebrar: 'Ebrar',
  yavuz: 'Yavuz',
  sude: 'Sude',
  sabiha: 'Sabiha',
  busra: 'Busra',
};

function parseTagMap(): TagMap {
  const raw = process.env.STANDUP_TAG_MAP || '';
  if (!raw) return { ...DEFAULT_TAG_MAP };
  try {
    const obj = JSON.parse(raw);
    if (Array.isArray(obj)) {
      return Object.fromEntries(obj.map((x: any) => [String(x.tag || x.key), String(x.designer || x.value)]));
    }
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [String(k), String(v as any)]));
  } catch {
    return { ...DEFAULT_TAG_MAP };
  }
}

async function ensureStandupBoard(userId: string) {
  const title = 'Daily Standup';
  let board = await prisma.board.findFirst({ where: { title } });
  if (!board) {
    board = await prisma.board.create({ data: { title, isPublic: false, ownerId: userId } });
  }
  return board;
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!SHOPIFY_CONFIG.shopName || !SHOPIFY_CONFIG.accessToken) {
      return NextResponse.json({ error: 'Missing Shopify credentials' }, { status: 400 });
    }

    const tagMap = parseTagMap();
    if (!tagMap || Object.keys(tagMap).length === 0) {
      return NextResponse.json({ error: 'STANDUP_TAG_MAP not configured' }, { status: 400 });
    }

    const board = await ensureStandupBoard(userId);

    // Ensure columns exist per designer
    const designers = Array.from(new Set(Object.values(tagMap)));
    const existingCols = await prisma.column.findMany({ where: { boardId: board.id }, orderBy: { order: 'asc' } });
    let maxOrder = existingCols.length > 0 ? Math.max(...existingCols.map(c => c.order)) : -1;
    const colByName = new Map(existingCols.map(c => [c.title, c]));
    for (const name of designers) {
      if (!colByName.has(name)) {
        const col = await prisma.column.create({ data: { title: name, order: ++maxOrder, boardId: board.id } });
        colByName.set(name, col);
      }
    }

    const sinceParam = new URL(request.url).searchParams.get('since');
    const since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const resp = await fetch(
      `https://${SHOPIFY_CONFIG.shopName}/admin/api/${SHOPIFY_CONFIG.apiVersion}/orders.json?status=any&limit=250&updated_at_min=${encodeURIComponent(since.toISOString())}`,
      { headers: { 'X-Shopify-Access-Token': SHOPIFY_CONFIG.accessToken, 'Content-Type': 'application/json' } }
    );
    if (!resp.ok) throw new Error(`Shopify API error: ${resp.status} ${resp.statusText}`);
    const data = await resp.json();
    const orders = data.orders || [];

    const tagToDesigner = (tags: string[]): string | null => {
      for (const t of tags) {
        const key = t.trim();
        if (tagMap[key]) return tagMap[key];
      }
      return null;
    };

    const created: Array<{ orderNumber: number; columnId: string; cardId: string }> = [];
    for (const order of orders) {
      const tags: string[] = (order.tags || '').split(',').map((x: string) => x.trim()).filter(Boolean);
      const designer = tagToDesigner(tags);
      if (!designer) continue;
      const column = colByName.get(designer);
      if (!column) continue;

      const existing = await prisma.card.findFirst({
        where: {
          columnId: column.id,
          title: { contains: `#${order.order_number}` },
        },
      });
      if (existing) continue;

      const maxOrderCard = await prisma.card.findFirst({ where: { columnId: column.id }, orderBy: { order: 'desc' } });
      const customerName = order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 'Guest Customer';
      const orderDetails = `\n🧑‍🎨 Designer: ${designer}\n📦 Order #${order.order_number}\n👤 Customer: ${customerName}\n💰 Total: ${order.currency} ${order.total_price}\n📅 Date: ${new Date(order.created_at).toLocaleString()}\nTags: ${tags.join(', ')}`;
      const card = await prisma.card.create({
        data: {
          columnId: column.id,
          title: `🧑‍🎨 ${designer} · #${order.order_number}`,
          description: orderDetails,
          order: (maxOrderCard?.order ?? -1) + 1,
        },
      });

      await prisma.activity.create({ data: { cardId: card.id, message: `Standup import for ${designer}`, userId } });
      created.push({ orderNumber: order.order_number, columnId: column.id, cardId: card.id });
    }

    return NextResponse.json({ success: true, created: created.length, details: created });
  } catch (error: any) {
    console.error('Standup import error:', error);
    return NextResponse.json({ error: error.message || 'Failed to import standup items' }, { status: 500 });
  }
}
