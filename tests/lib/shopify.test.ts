import { describe, it, expect, vi, beforeEach } from 'vitest';

// We will import functions under test; for getOrderById we may re-import after env setup
import { normalizeTags, mapShipping } from '../../lib/shopify';

describe('normalizeTags', () => {
  it('splits, trims, lowercases, and collapses spaces', () => {
    const input = ' priority ,  Express,  Shop   Location   ';
    const out = normalizeTags(input);
    expect(out).toEqual(['priority', 'express', 'shop location']);
  });

  it('returns empty array for null/undefined/empty', () => {
    expect(normalizeTags(null as any)).toEqual([]);
    expect(normalizeTags(undefined as any)).toEqual([]);
    expect(normalizeTags('')).toEqual([]);
  });
});

describe('mapShipping', () => {
  it('maps Priority', () => {
    expect(mapShipping('Priority Shipping')).toBe('Priority');
  });
  it('maps Express', () => {
    expect(mapShipping('Express Saver')).toBe('Express');
  });
  it('maps Pickup and Shop Location', () => {
    expect(mapShipping('Shop Location Pickup')).toBe('Pickup');
    expect(mapShipping('pickup at store')).toBe('Pickup');
  });
  it('maps Ground variations', () => {
    expect(mapShipping('Free Ground Shipping')).toBe('Ground');
    expect(mapShipping('Ground Shipping')).toBe('Ground');
    expect(mapShipping('shipping')).toBe('Ground');
  });
  it('defaults unknown to Ground', () => {
    expect(mapShipping('unknown method')).toBe('Ground');
  });
});

// Designer feature removed; no tests for designer detection.

describe('getOrderById', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns null when env is missing', async () => {
    delete (process.env as any).SHOPIFY_SHOP_NAME;
    delete (process.env as any).SHOPIFY_ACCESS_TOKEN;
    const mod = await import('../../lib/shopify');
    const out = await mod.getOrderById(12345);
    expect(out).toBeNull();
  });

  it('fetches order when env present and returns order', async () => {
    (global as any).fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ order: { id: 12345, order_number: 99 } })
    }));

    (process.env as any).SHOPIFY_SHOP_NAME = 'test-shop.myshopify.com';
    (process.env as any).SHOPIFY_ACCESS_TOKEN = 'shpat_test_token';

    const mod = await import('../../lib/shopify');
    const out = await mod.getOrderById(12345);
    expect(out).toEqual({ id: 12345, order_number: 99 });

    const expectedUrl = `https://test-shop.myshopify.com/admin/api/${mod.SHOPIFY_CONFIG.apiVersion}/orders/12345.json`;
    expect((global as any).fetch).toHaveBeenCalledWith(expectedUrl, expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({ 'X-Shopify-Access-Token': 'shpat_test_token' })
    }));
  });

  it('returns null when fetch not ok', async () => {
    (global as any).fetch = vi.fn(async () => ({ ok: false }));
    (process.env as any).SHOPIFY_SHOP_NAME = 'test-shop.myshopify.com';
    (process.env as any).SHOPIFY_ACCESS_TOKEN = 'shpat_test_token';
    const mod = await import('../../lib/shopify');
    const out = await mod.getOrderById(999);
    expect(out).toBeNull();
  });
});
