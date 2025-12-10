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
