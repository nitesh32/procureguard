import { z } from 'zod';
import { suppliersWithPayees } from '../store';
import { defineTool, requireRecord, ToolInputError } from './tool';

export const checkInventory = defineTool({
  name: 'check_inventory',
  description: 'List stock levels; low=true means stock is below the reorder level.',
  inputSchema: { sku: z.string().optional() },
  run: ({ sku }, store) => {
    const items = sku
      ? [requireRecord(store.data.inventory.find((item) => item.sku === sku), `Unknown sku ${sku}`)]
      : store.data.inventory;
    return items.map((item) => ({ ...item, low: item.stock < item.reorderLevel }));
  },
});

export const listSuppliers = defineTool({
  name: 'list_suppliers',
  description: 'List suppliers with their masked payee bank account.',
  inputSchema: {},
  run: (_args, store) => suppliersWithPayees(store.data),
});

export const getQuote = defineTool({
  name: 'get_quote',
  description: 'Get a quote by quoteId, or all quotes for a sku. Amounts are integer rupees.',
  inputSchema: { quoteId: z.string().optional(), sku: z.string().optional() },
  run: ({ quoteId, sku }, store) => {
    if (quoteId) return requireRecord(store.data.quotes.find((quote) => quote.id === quoteId), `Unknown quote ${quoteId}`);
    if (sku) return store.data.quotes.filter((quote) => quote.sku === sku);
    throw new ToolInputError('Provide quoteId or sku');
  },
});

export const readQuoteDocument = defineTool({
  name: 'read_quote_document',
  description: "Read the supplier's quote document text.",
  inputSchema: { quoteId: z.string() },
  run: ({ quoteId }, store) => {
    const document = requireRecord(
      store.data.documents.find((doc) => doc.quoteId === quoteId),
      `No document for quote ${quoteId}`,
    );
    return { quoteId, filename: document.filename, text: document.text };
  },
});

export const readTools = [checkInventory, listSuppliers, getQuote, readQuoteDocument];
