export type InventoryItem = { sku: string; name: string; category: string; stock: number; reorderLevel: number; unit: string };
export type Supplier = { id: string; name: string; contactEmail: string; payeeId: string; rating: number };
export type Payee = { id: string; supplierId: string; bankName: string; accountNumber: string; ifsc: string; updatedAt: string };
export type Quote = { id: string; supplierId: string; sku: string; unitPrice: number; qty: number; amount: number; currency: string; documentId: string };
export type QuoteDocument = { id: string; quoteId: string; filename: string; text: string };
export type Order = { id: string; quoteId: string; supplierId: string; sku: string; qty: number; amount: number; currency: string; placedBy: string; status: string; createdAt: string };
export type Note = { id: string; entityType: string; entityId: string; text: string; author: string; createdAt: string };
export type ReviewFlag = { id: string; entityType: string; entityId: string; reason: string; createdAt: string };

export type Shop = {
  inventory: InventoryItem[];
  suppliers: Supplier[];
  payees: Payee[];
  quotes: Quote[];
  documents: QuoteDocument[];
  orders: Order[];
  notes: Note[];
  reviewFlags: ReviewFlag[];
};

export type Store = { data: Shop; reset: () => void };

export function createStore(seed: Shop): Store {
  const store: Store = {
    data: structuredClone(seed),
    reset: () => {
      store.data = structuredClone(seed);
    },
  };
  return store;
}

export function nextId(prefix: string, records: unknown[]): string {
  return `${prefix}-${String(records.length + 1).padStart(4, '0')}`;
}

export function recordCounts(data: Shop): Record<string, number> {
  return Object.fromEntries(Object.entries(data).map(([name, records]) => [name, records.length]));
}

export function maskAccountNumber(accountNumber: string): string {
  return `••••${accountNumber.slice(-4)}`;
}

export function suppliersWithPayees(data: Shop) {
  return data.suppliers.map((supplier) => {
    const payee = data.payees.find((p) => p.id === supplier.payeeId);
    return {
      ...supplier,
      payee: payee && {
        bankName: payee.bankName,
        accountNumberMasked: maskAccountNumber(payee.accountNumber),
        ifsc: payee.ifsc,
        updatedAt: payee.updatedAt,
      },
    };
  });
}

/** Read-only view for the dashboard panels. */
export function shopState(data: Shop) {
  return {
    inventory: data.inventory,
    orders: [...data.orders].reverse(),
    suppliers: suppliersWithPayees(data),
    reviewFlags: data.reviewFlags,
    notes: data.notes,
  };
}
