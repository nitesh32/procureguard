import { Ban, Check, CirclePause } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ShopState } from '../api';
import { rupees, type Call } from '../feed';

type Tab = 'orders' | 'suppliers' | 'inventory';

// Which tab shows the effect of a tool call, so the rail follows the agent.
const tabForTool: Record<string, Tab> = {
  place_order: 'orders',
  update_payee_bank: 'suppliers',
  delete_supplier: 'suppliers',
  export_supplier_list: 'suppliers',
  list_suppliers: 'suppliers',
  check_inventory: 'inventory',
};

type WorldTabsProps = { shop: ShopState | null; calls: Call[] };

// The world the agent touches. Effects show here; blocked attempts show that nothing changed.
export function WorldTabs({ shop, calls }: WorldTabsProps) {
  const [tab, setTab] = useState<Tab>('orders');
  const latestEffect = [...calls].reverse().find((call) => tabForTool[call.tool]);
  const followTab = latestEffect && tabForTool[latestEffect.tool];
  const followKey = latestEffect && `${latestEffect.id}:${latestEffect.verdict}`;
  useEffect(() => {
    if (followTab) setTab(followTab);
  }, [followKey, followTab]);

  if (!shop) return <p className="px-4 py-4 text-sm text-muted sm:px-6">Loading shop data…</p>;

  const pending = calls.filter((call) => call.verdict === 'held' && call.args.amount !== undefined);
  const blockedTargets = new Set(calls.filter((call) => call.verdict === 'blocked').map((call) => String(call.args.supplierId ?? '')));
  const lowCount = shop.inventory.filter((item) => item.stock < item.reorderLevel).length;
  const tabs: { id: Tab; label: string; badge: number; alert?: boolean }[] = [
    { id: 'orders', label: 'Orders', badge: shop.orders.length + pending.length },
    { id: 'suppliers', label: 'Suppliers', badge: shop.suppliers.length, alert: blockedTargets.size > 0 },
    { id: 'inventory', label: 'Inventory', badge: lowCount, alert: lowCount > 0 },
  ];

  return (
    <section aria-label="Shop data" className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label="Shop data" className="flex gap-4 border-b border-line px-4 sm:px-6">
        {tabs.map(({ id, label, badge, alert }) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            type="button"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`-mb-px flex h-10 items-center gap-1.5 border-b-2 text-sm font-medium transition-colors ${
              tab === id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
            <span className={`text-xs tabular-nums ${alert ? 'text-blocked' : 'text-muted'}`}>{badge}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="min-h-0 flex-1 overflow-y-auto px-4 py-2 sm:px-6">
        {tab === 'orders' && <Orders shop={shop} pending={pending} />}
        {tab === 'suppliers' && <Suppliers shop={shop} blockedTargets={blockedTargets} />}
        {tab === 'inventory' && <Inventory shop={shop} />}
      </div>
    </section>
  );
}

function Orders({ shop, pending }: { shop: ShopState; pending: Call[] }) {
  if (shop.orders.length + pending.length === 0) return <p className="py-6 text-center text-sm text-muted">No orders yet. Orders the agent places appear here.</p>;
  return (
    <ul className="divide-y divide-line">
      {pending.map((call) => (
        <li key={call.id} className="flex items-center gap-3 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium tabular-nums">{rupees(Number(call.args.amount))}</span>
            <span className="block truncate font-mono text-xs text-muted">{String(call.args.quoteId)} · {String(call.args.sku)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-held">
            <CirclePause className="h-3.5 w-3.5" aria-hidden /> Pending approval
          </span>
        </li>
      ))}
      {shop.orders.map((order) => (
        <li key={order.id} className="flex items-center gap-3 py-2.5">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium tabular-nums">{rupees(order.amount)}</span>
            <span className="block truncate font-mono text-xs text-muted">{order.id} · {order.sku}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-allowed">
            <Check className="h-3.5 w-3.5" aria-hidden /> Placed
          </span>
        </li>
      ))}
    </ul>
  );
}

function Suppliers({ shop, blockedTargets }: { shop: ShopState; blockedTargets: Set<string> }) {
  return (
    <ul className="divide-y divide-line">
      {shop.suppliers.map((supplier) => {
        const attacked = blockedTargets.has(supplier.id);
        return (
          <li key={supplier.id} className={`-mx-2 rounded-md px-2 py-2.5 ${attacked ? 'bg-blocked/5' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm font-medium">{supplier.name}</span>
              <span className="shrink-0 font-mono text-sm text-muted tabular-nums">{supplier.payee?.accountNumberMasked ?? '—'}</span>
            </div>
            {attacked && (
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-blocked">
                <Ban className="h-3.5 w-3.5" aria-hidden /> Bank change blocked · account unchanged
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Inventory({ shop }: { shop: ShopState }) {
  const onOrder = (sku: string) => shop.orders.filter((order) => order.sku === sku).reduce((sum, order) => sum + order.qty, 0);
  return (
    <ul className="divide-y divide-line">
      {shop.inventory.map((item) => {
        const low = item.stock < item.reorderLevel;
        const ordered = onOrder(item.sku);
        return (
          <li key={item.sku} className="py-2.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 truncate font-medium">{item.name}</span>
              <span className="shrink-0 text-muted tabular-nums">
                {ordered > 0 && <span className="mr-2 text-xs font-medium text-allowed">+{ordered} on order</span>}
                <span className={low ? 'font-medium text-blocked' : ''}>{item.stock}</span> / {item.reorderLevel}
                {low && <span className="sr-only"> (below reorder level)</span>}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-panel-2" aria-hidden>
              <div className={`h-full rounded-full ${low ? 'bg-blocked' : 'bg-muted'}`} style={{ width: `${Math.min(100, (item.stock / item.reorderLevel) * 50)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

