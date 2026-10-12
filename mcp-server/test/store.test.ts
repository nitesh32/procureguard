import { describe, expect, it } from 'vitest';
import { shopState } from '../src/store';
import { freshStore, shopSeed } from './fixtures';

describe('store', () => {
  it('reset restores the seed exactly after mutations', () => {
    const store = freshStore();
    store.data.payees[2].accountNumber = 'FAKE00000099';
    store.data.orders.push({ ...store.data.orders[0], id: 'ORD-0001' });

    store.reset();

    expect(store.data).toEqual(shopSeed);
  });

  it('never mutates the seed itself', () => {
    const store = freshStore();
    store.data.inventory[0].stock = 999;
    expect(shopSeed.inventory[0].stock).toBe(4);
  });

  it('shows only masked payee accounts in the dashboard state', () => {
    const { suppliers } = shopState(freshStore().data);
    expect(suppliers[2].payee).toMatchObject({ accountNumberMasked: '••••0033' });
    expect(JSON.stringify(suppliers)).not.toContain('FAKE00000033');
  });
});
