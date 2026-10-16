import type { ReactNode } from 'react';
import type { ShopState } from '../api';
import { rupees, type Call } from '../feed';

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-line bg-panel">
      <h2 className="border-b border-line px-4 py-2 text-xs font-semibold tracking-wider text-muted uppercase">{title}</h2>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-1">{children}</div>
    </section>
  );
}

type WorldPanelProps = { shop: ShopState | null; calls: Call[] };

// The world the agent touches. Effects show here; blocked attempts show that nothing changed.
export function WorldPanel({ shop, calls }: WorldPanelProps) {
  if (!shop) return <p className="p-4 text-sm text-muted">Loading shop data…</p>;

  const blockedTargets = new Set(calls.filter((call) => call.verdict === 'blocked').map((call) => String(call.args.supplierId ?? '')));
  const pendingOrders = calls.filter((call) => call.verdict === 'held' && call.args.amount !== undefined);
  const onOrder = (sku: string) => shop.orders.filter((order) => order.sku === sku).reduce((sum, order) => sum + order.qty, 0);

  return (
    <div className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
      <Panel title="Suppliers · payee account">
        <ul className="divide-y divide-line">
          {shop.suppliers.map((supplier) => {
            const attacked = blockedTargets.has(supplier.id);
            return (
              <li key={supplier.id} className={`-mx-4 flex items-center justify-between gap-2 px-4 py-1.5 text-sm ${attacked ? 'animate-flash-red' : ''}`}>
                <span>
                  {supplier.name}
                  {attacked && <span className="ml-2 text-xs font-semibold text-blocked">⛔ change attempt blocked</span>}
                </span>
                <span className={`font-mono text-sm ${attacked ? 'text-ink' : 'text-muted'}`}>{supplier.payee?.accountNumberMasked ?? '—'}</span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Inventory · stock / reorder level">
        <ul className="divide-y divide-line">
          {shop.inventory.map((item) => {
            const low = item.stock < item.reorderLevel;
            const ordered = onOrder(item.sku);
            return (
              <li key={item.sku} className="flex items-center gap-2 py-1 text-sm">
                <span className={`h-4 w-1 rounded-full ${low ? 'bg-blocked' : 'bg-line'}`} aria-hidden />
                <span className="flex-1 truncate">{item.name}</span>
                {ordered > 0 && <span className="animate-slide-in text-xs font-semibold text-allowed">+{ordered} on order</span>}
                <span className={`font-mono tabular-nums ${low ? 'text-blocked' : 'text-muted'}`}>
                  {item.stock}/{item.reorderLevel}
                  {low && <span className="sr-only"> (below reorder level)</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title={`Orders (${shop.orders.length + pendingOrders.length})`}>
        {shop.orders.length + pendingOrders.length === 0 && <p className="py-2 text-sm text-muted">No orders yet.</p>}
        <ul className="space-y-1.5 py-1.5">
          {pendingOrders.map((call) => (
            <li key={call.id} className="flex animate-slide-in items-center justify-between rounded-md border border-held/50 bg-held/10 px-3 py-1.5 text-sm">
              <span className="font-mono text-xs">{String(call.args.quoteId)} · {String(call.args.sku)}</span>
              <span className="text-xs font-semibold text-held">⏸ Pending approval · {rupees(Number(call.args.amount))}</span>
            </li>
          ))}
          {shop.orders.map((order) => (
            <li key={order.id} className="flex animate-slide-in items-center justify-between rounded-md border border-allowed/40 bg-allowed/10 px-3 py-1.5 text-sm">
              <span className="font-mono text-xs">{order.id} · {order.sku}</span>
              <span className="text-xs font-semibold text-allowed">✓ Placed · {rupees(order.amount)}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
