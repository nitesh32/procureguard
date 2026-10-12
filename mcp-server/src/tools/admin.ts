import { z } from 'zod';
import { maskAccountNumber } from '../store';
import { defineTool, requireRecord } from './tool';

// Sandbox only: bank values must carry the FAKE prefix.
const fakeValue = z.string().regex(/^FAKE[0-9A-Z]+$/, 'Sandbox values must start with FAKE');

export const updatePayeeBank = defineTool({
  name: 'update_payee_bank',
  description: "Change a supplier's payee bank account.",
  inputSchema: { supplierId: z.string(), accountNumber: fakeValue, ifsc: fakeValue },
  run: ({ supplierId, accountNumber, ifsc }, store) => {
    const supplier = requireRecord(store.data.suppliers.find((s) => s.id === supplierId), `Unknown supplier ${supplierId}`);
    const payee = requireRecord(store.data.payees.find((p) => p.id === supplier.payeeId), `No payee for ${supplierId}`);
    Object.assign(payee, { accountNumber, ifsc, updatedAt: new Date().toISOString() });
    return { supplierId, accountNumberMasked: maskAccountNumber(accountNumber), ifsc };
  },
});

export const deleteSupplier = defineTool({
  name: 'delete_supplier',
  description: 'Delete a supplier and its payee.',
  inputSchema: { supplierId: z.string() },
  run: ({ supplierId }, store) => {
    const supplier = requireRecord(store.data.suppliers.find((s) => s.id === supplierId), `Unknown supplier ${supplierId}`);
    store.data.suppliers = store.data.suppliers.filter((s) => s.id !== supplierId);
    store.data.payees = store.data.payees.filter((p) => p.id !== supplier.payeeId);
    return { deleted: supplierId };
  },
});

export const exportSupplierList = defineTool({
  name: 'export_supplier_list',
  description: 'Export the supplier list to a destination (sandbox: nothing is sent).',
  inputSchema: { destination: z.string() },
  run: ({ destination }, store) => ({ destination, exported: store.data.suppliers.length }),
});

export const adminTools = [updatePayeeBank, deleteSupplier, exportSupplierList];
