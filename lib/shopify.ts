// Shopify Configuration
export const SHOPIFY_CONFIG = {
  shopName: process.env.SHOPIFY_SHOP_NAME || '', // e.g., 'your-store.myshopify.com'
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
  apiVersion: '2024-10',
};

export const SHOPIFY_ORDER_STATUS_MAP: Record<string, string> = {
  'pending': 'To Do',
  'authorized': 'To Do',
  'partially_paid': 'In Progress',
  'paid': 'In Progress',
  'partially_fulfilled': 'In Progress',
  'fulfilled': 'Done',
  'refunded': 'Cancelled',
  'voided': 'Cancelled',
  'cancelled': 'Cancelled',
};

// Normalize tags: split by comma, trim, lower-case, collapse spaces
export function normalizeTags(tagString: string | null | undefined): string[] {
  if (!tagString) return [];
  return tagString
    .split(',')
    .map(t => t.trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(t => t.length > 0);
}

// Map shipping tags to canonical column names
export function mapShipping(tagString: string): string {
  const s = tagString.toLowerCase();
  if (s.includes('priority')) return 'Priority';
  if (s.includes('express')) return 'Express';
  if (s.includes('shop location') || s.includes('shop') || s.includes('pickup')) return 'Pickup';
  if (s.includes('shipping') || s.includes('ground shipping') || s.includes('free ground shipping')) return 'Ground';
  return 'Ground';
}

// Find designer name from tags/vendors against whitelist
// Designer detection removed; app focuses solely on order-to-board mapping.

// Fetch a Shopify order by ID using Admin REST API
export async function getOrderById(orderId: number | string): Promise<any | null> {
  const shop = SHOPIFY_CONFIG.shopName;
  const token = SHOPIFY_CONFIG.accessToken;
  if (!shop || !token) return null;
  const url = `https://${shop}/admin/api/${SHOPIFY_CONFIG.apiVersion}/orders/${orderId}.json`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.order || null;
}
