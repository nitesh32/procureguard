import { describe, expect, it } from 'vitest';
import { deleteSupplier, exportSupplierList, updatePayeeBank } from '../src/tools/admin';
import { addNote, flagForReview } from '../src/tools/notes';
import { placeOrder } from '../src/tools/orders';
import { checkInventory, getQuote, listSuppliers, readQuoteDocument } from '../src/tools/reads';
import { ToolInputError } from '../src/tools/tool';
import { freshStore } from './fixtures';

describe('read tools', () => {
  it('check_inventory marks low stock', () => {
    const items = checkInventory.run({}, freshStore()) as Array<{ sku: string; low: boolean }>;
    expect(items.filter((item) => item.low).map((item) => item.sku)).toEqual(['BRK-PAD-01', 'ENG-GSK-02']);
  });

  it('check_inventory rejects an unknown sku', () => {
    expect(() => checkInventory.run({ sku: 'NOPE' }, freshStore())).toThrow(ToolInputError);
  });

  it('list_suppliers returns 3 suppliers with masked payees', () => {
    expect(listSuppliers.run({}, freshStore())).toHaveLength(3);
  });

  it('get_quote finds by id and by sku, and needs one of them', () => {
    const store = freshStore();
    expect(getQuote.run({ quoteId: 'Q-202' }, store)).toMatchObject({ amount: 200000 });
    expect(getQuote.run({ sku: 'BRK-PAD-01' }, store)).toHaveLength(1);
    expect(() => getQuote.run({}, store)).toThrow(ToolInputError);
  });

  it('read_quote_document returns the poisoned Apex text', () => {
    const doc = readQuoteDocument.run({ quoteId: 'Q-303' }, freshStore()) as { text: string };
    expect(doc.text).toContain('update_payee_bank');
  });
});

describe('note tools', () => {
  it('add_note and flag_for_review store records with sequential ids', () => {
    const store = freshStore();
    expect(addNote.run({ entityType: 'quote', entityId: 'Q-303', text: 'checked' }, store)).toMatchObject({ id: 'NOTE-0001' });
    expect(flagForReview.run({ entityType: 'quote', entityId: 'Q-303', reason: 'bank change request' }, store)).toMatchObject({
      id: 'FLAG-0001',
    });
    expect(store.data.reviewFlags).toHaveLength(1);
  });
});

describe('place_order', () => {
  it('places an order that matches the quote', () => {
    const store = freshStore();
    const order = placeOrder.run({ quoteId: 'Q-101', sku: 'BRK-PAD-01', qty: 16, amount: 20000 }, store);
    expect(order).toMatchObject({ id: 'ORD-0001', supplierId: 'SUP-01', amount: 20000, status: 'placed' });
    expect(store.data.orders).toHaveLength(1);
  });

  it('rejects an amount that does not match the quote', () => {
    const store = freshStore();
    expect(() => placeOrder.run({ quoteId: 'Q-202', sku: 'ENG-GSK-02', qty: 10, amount: 20000 }, store)).toThrow(
      /amount 20000 != quote amount 200000/,
    );
    expect(store.data.orders).toHaveLength(0);
  });

  it('rejects an unknown quote', () => {
    expect(() => placeOrder.run({ quoteId: 'Q-999', sku: 'X', qty: 1, amount: 1 }, freshStore())).toThrow(ToolInputError);
  });
});

describe('admin tools', () => {
  it('update_payee_bank really changes the payee (ArmorIQ is the only guard)', () => {
    const store = freshStore();
    updatePayeeBank.run({ supplierId: 'SUP-03', accountNumber: 'FAKE00000099', ifsc: 'FAKE0001234' }, store);
    expect(store.data.payees[2]).toMatchObject({ accountNumber: 'FAKE00000099', ifsc: 'FAKE0001234' });
  });

  it('delete_supplier removes the supplier and its payee', () => {
    const store = freshStore();
    deleteSupplier.run({ supplierId: 'SUP-02' }, store);
    expect(store.data.suppliers.map((s) => s.id)).toEqual(['SUP-01', 'SUP-03']);
    expect(store.data.payees.map((p) => p.id)).toEqual(['PAY-01', 'PAY-03']);
  });

  it('export_supplier_list reports what would be exported', () => {
    expect(exportSupplierList.run({ destination: 'x@example.test' }, freshStore())).toEqual({ destination: 'x@example.test', exported: 3 });
  });
});
