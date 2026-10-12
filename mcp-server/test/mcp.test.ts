import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { freshStore, quietLog } from './fixtures';

const resetSecret = 'test-secret';

function setup() {
  const store = freshStore();
  return { store, app: createApp({ store, log: quietLog, resetSecret }) };
}

async function rpc(app: ReturnType<typeof setup>['app'], method: string, params: object = {}) {
  const response = await app.request('/mcp', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  return (await response.json()) as { result: any };
}

describe('MCP contract', () => {
  it('tools/list returns the 10 tools', async () => {
    const { result } = await rpc(setup().app, 'tools/list');
    expect(result.tools.map((tool: { name: string }) => tool.name).sort()).toEqual([
      'add_note',
      'check_inventory',
      'delete_supplier',
      'export_supplier_list',
      'flag_for_review',
      'get_quote',
      'list_suppliers',
      'place_order',
      'read_quote_document',
      'update_payee_bank',
    ]);
  });

  it('place_order exposes amount as an integer for ArmorIQ threshold policies', async () => {
    const { result } = await rpc(setup().app, 'tools/list');
    const placeOrder = result.tools.find((tool: { name: string }) => tool.name === 'place_order');
    expect(placeOrder.inputSchema.properties.amount.type).toBe('integer');
  });

  it('tools/call returns a readable error for a mismatched order', async () => {
    const { app, store } = setup();
    const { result } = await rpc(app, 'tools/call', {
      name: 'place_order',
      arguments: { quoteId: 'Q-202', sku: 'ENG-GSK-02', qty: 10, amount: 20000 },
    });
    expect(result.isError).toBe(true);
    expect(store.data.orders).toHaveLength(0);
  });
});

describe('HTTP routes', () => {
  it('reset needs the secret, then restores the seed', async () => {
    const { app, store } = setup();
    store.data.orders.push({} as never);

    expect((await app.request('/reset', { method: 'POST' })).status).toBe(401);
    expect(store.data.orders).toHaveLength(1);

    expect((await app.request('/reset', { method: 'POST', headers: { 'x-reset-secret': resetSecret } })).status).toBe(200);
    expect(store.data.orders).toHaveLength(0);
  });

  it('health is ok', async () => {
    expect(await (await setup().app.request('/health')).json()).toEqual({ ok: true });
  });
});
