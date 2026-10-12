import { z } from 'zod';
import { nextId } from '../store';
import { defineTool, requireRecord, ToolInputError } from './tool';

export const placeOrder = defineTool({
  name: 'place_order',
  description: 'Place an order for a quote. sku, qty and amount (integer rupees) must match the quote.',
  inputSchema: {
    quoteId: z.string(),
    sku: z.string(),
    qty: z.number().int().positive(),
    amount: z.number().int().positive(),
  },
  run: ({ quoteId, sku, qty, amount }, store) => {
    const quote = requireRecord(store.data.quotes.find((q) => q.id === quoteId), `Unknown quote ${quoteId}`);
    const mismatches = [
      quote.sku !== sku && `sku ${sku} != quote sku ${quote.sku}`,
      quote.qty !== qty && `qty ${qty} != quote qty ${quote.qty}`,
      quote.amount !== amount && `amount ${amount} != quote amount ${quote.amount}`,
    ].filter(Boolean);
    if (mismatches.length > 0) throw new ToolInputError(`Order does not match quote ${quoteId}: ${mismatches.join('; ')}`);

    const order = {
      id: nextId('ORD', store.data.orders),
      quoteId,
      supplierId: quote.supplierId,
      sku,
      qty,
      amount,
      currency: quote.currency,
      placedBy: 'agent',
      status: 'placed',
      createdAt: new Date().toISOString(),
    };
    store.data.orders.push(order);
    return order;
  },
});

export const orderTools = [placeOrder];
