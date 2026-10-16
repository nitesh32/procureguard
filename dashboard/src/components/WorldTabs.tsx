import { Ban, Building2, Check, CirclePause, Package, ShoppingCart, type LucideIcon } from 'lucide-react';
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

  if (!shop) return <section className="rounded-2xl border border-line bg-panel p-4 text-sm text-muted">Loading shop data…</section>;

  const pending = calls.filter((call) => call.verdict === 'held' && call.args.amount !== undefined);
  const blockedTargets = new Set(calls.filter((call) => call.verdict === 'blocked').map((call) => String(call.args.supplierId ?? '')));
  const lowCount = shop.inventory.filter((item) => item.stock < item.reorderLevel).length;
  const tabs: { id: Tab; label: string; Icon: LucideIcon; badge: number; alert?: boolean }[] = [
    { id: 'orders', label: 'Orders', Icon: ShoppingCart, badge: shop.orders.length + pending.length },
    { id: 'suppliers', label: 'Suppliers', Icon: Building2, badge: shop.suppliers.length, alert: blockedTargets.size > 0 },
    { id: 'inventory', label: 'Inventory', Icon: Package, badge: lowCount, alert: lowCount > 0 },
  ];

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-line bg-panel shadow-sm">
      <div role="tablist" aria-label="Shop data" className="flex gap-1 border-b border-line p-1.5">
        {tabs.map(({ id, label, Icon, badge, alert }) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
              tab === id ? 'bg-panel-2 text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
            <span className={`rounded-full px-1.5 text-xs tabular-nums ${alert ? 'bg-blocked/10 text-blocked' : 'bg-panel-2 text-muted'}`}>{badge}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === 'orders' && <Orders shop={shop} pending={pending} />}
        {tab === 'suppliers' && <Suppliers shop={shop} blockedTargets={blockedTargets} />}
        {tab === 'inventory' && <Inventory shop={shop} />}
      </div>
    </section>
  );
}

function Orders({ shop, pending }: { shop: ShopState; pending: Call[] }) {
  if (shop.orders.length + pending.length === 0) return <Empty Icon={ShoppingCart} text="No orders yet. Orders the agent places appear here." />;
  return (
    <ul className="space-y-2">
      {pending.map((call) => (
        <li key={call.id} className="flex animate-slide-in items-center gap-3 rounded-xl border border-held/30 bg-held/5 px-3 py-2.5">
          <CirclePause className="h-5 w-5 shrink-0 text-held" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{rupees(Number(call.args.amount))}</span>
            <span className="block truncate font-mono text-xs text-muted">{String(call.args.quoteId)} · {String(call.args.sku)}</span>
          </span>
          <span className="text-xs font-medium text-held">Pending approval</span>
        </li>
      ))}
      {shop.orders.map((order) => (
        <li key={order.id} className="flex animate-slide-in items-center gap-3 rounded-xl border border-allowed/30 bg-allowed/5 px-3 py-2.5">
          <Check className="h-5 w-5 shrink-0 text-allowed" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{rupees(order.amount)}</span>
            <span className="block truncate font-mono text-xs text-muted">{order.id} · {order.sku}</span>
          </span>
          <span className="text-xs font-medium text-allowed">Placed</span>
        </li>
      ))}
    </ul>
  );
}

function Suppliers({ shop, blockedTargets }: { shop: ShopState; blockedTargets: Set<string> }) {
  return (
    <ul className="space-y-1">
      {shop.suppliers.map((supplier) => {
        const attacked = blockedTargets.has(supplier.id);
        return (
          <li key={supplier.id} className={`rounded-xl px-3 py-2.5 ${attacked ? 'animate-flash-red ring-1 ring-blocked/30' : ''}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">{supplier.name}</span>
              <span className="font-mono text-sm text-muted">{supplier.payee?.accountNumberMasked ?? '—'}</span>
            </div>
            {attacked && (
              <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-blocked">
                <Ban className="h-3.5 w-3.5" aria-hidden /> Bank change attempt blocked · account unchanged
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
    <ul className="space-y-1">
      {shop.inventory.map((item) => {
        const low = item.stock < item.reorderLevel;
        const ordered = onOrder(item.sku);
        return (
          <li key={item.sku} className="rounded-xl px-3 py-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="tabular-nums text-muted">
                {ordered > 0 && <span className="mr-2 text-xs font-medium text-allowed">+{ordered} on order</span>}
                <span className={low ? 'font-medium text-blocked' : ''}>{item.stock}</span> / {item.reorderLevel}
                {low && <span className="sr-only"> (below reorder level)</span>}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-panel-2" aria-hidden>
              <div className={`h-full rounded-full ${low ? 'bg-blocked' : 'bg-allowed'}`} style={{ width: `${Math.min(100, (item.stock / item.reorderLevel) * 50)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Empty({ Icon, text }: { Icon: LucideIcon; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center text-sm text-muted">
      <Icon className="h-6 w-6 text-line" aria-hidden />
      {text}
    </div>
  );
}
