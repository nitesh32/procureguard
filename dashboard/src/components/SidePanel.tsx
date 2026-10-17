import type { ReactNode } from 'react';
import type { ShopState } from '../api';
import { clock, rupees, summarize, type Call } from '../feed';
import { VerdictWord } from './Verdict';

const logLength = 12;

type SidePanelProps = { shop: ShopState | null; calls: Call[] };

// The quiet right panel: ArmorIQ's decisions for the session, and the shop the agent touches.
export function SidePanel({ shop, calls }: SidePanelProps) {
  const summary = summarize(calls);
  const log = calls.slice(-logLength).reverse();
  const pending = calls.filter((call) => call.verdict === 'held' && call.args.amount !== undefined);
  const attacked = new Set(calls.filter((call) => call.verdict === 'blocked').map((call) => String(call.args.supplierId ?? '')));
  const lowStock = shop?.inventory.filter((item) => item.stock < item.reorderLevel) ?? [];

  return (
    <aside aria-label="ArmorIQ decisions and shop data" className="space-y-10 px-4 py-10 sm:px-8 lg:min-h-0 lg:overflow-y-auto lg:pt-14 lg:pr-10 lg:pl-4">
      <Section title="This session">
        <p aria-live="polite" className="text-[17px] text-ink tabular-nums">
          {summary.allowed} allowed · {summary.held} held · {summary.blocked} blocked
        </p>
      </Section>

      <Section title="Decision log">
        {log.length === 0 ? (
          <Empty>Nothing yet</Empty>
        ) : (
          <ol className="space-y-1.5">
            {log.map((call) => (
              <li key={call.id} className="flex min-w-0 items-center gap-3 font-mono text-[13px] tabular-nums">
                <span className="min-w-0 flex-1 truncate" title={call.tool}>
                  {clock(call.startedAt)} · {call.tool}
                </span>
                <VerdictWord verdict={call.verdict} />
              </li>
            ))}
          </ol>
        )}
      </Section>

      {!shop ? (
        <p className="text-sm text-faint">Loading shop data…</p>
      ) : (
        <>
          <Section title="Suppliers">
            <ul className="space-y-2.5">
              {shop.suppliers.map((supplier) => (
                <li key={supplier.id} className="text-[15px]">
                  <span className="flex min-w-0 items-baseline gap-2">
                    <span className="min-w-0 truncate">{supplier.name}</span>
                    <span className="shrink-0 font-mono text-[13px] text-muted tabular-nums">{supplier.payee?.accountNumberMasked ?? '—'}</span>
                  </span>
                  {attacked.has(supplier.id) && <span className="block text-sm text-blocked">Bank change blocked, unchanged</span>}
                </li>
              ))}
            </ul>
          </Section>

          {lowStock.length > 0 && (
            <Section title="Low stock">
              <ul className="space-y-3">
                {lowStock.map((item) => (
                  <li key={item.sku} className="text-[15px]">
                    <span className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate">{item.name}</span>
                      <span className="shrink-0 font-mono text-[13px] text-muted tabular-nums">
                        {item.stock} / {item.reorderLevel}
                      </span>
                    </span>
                    <span aria-hidden className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line">
                      <span className="block h-full rounded-full bg-faint" style={{ width: `${(item.stock / item.reorderLevel) * 100}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {shop.reviewFlags.length > 0 && (
            <Section title="Flagged for review">
              <ul className="space-y-1.5">
                {shop.reviewFlags.map((flag) => (
                  <li key={flag.id} className="truncate text-[15px]" title={flag.reason}>
                    {flag.entityId} — {flag.reason}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Orders">
            {shop.orders.length + pending.length === 0 ? (
              <Empty>No orders yet</Empty>
            ) : (
              <ul className="space-y-3">
                {pending.map((call) => (
                  <Order key={call.id} amount={Number(call.args.amount)} quoteId={String(call.args.quoteId)} sku={String(call.args.sku)} status={<span className="text-held">Pending approval</span>} />
                ))}
                {shop.orders.map((order) => (
                  <Order key={order.id} amount={order.amount} quoteId={order.quoteId} sku={order.sku} status={<span className="text-allowed">Placed</span>} />
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-sm text-faint">{title}</h2>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-[15px] text-faint italic">{children}</p>;

function Order({ amount, quoteId, sku, status }: { amount: number; quoteId: string; sku: string; status: ReactNode }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className="block truncate font-mono text-[15px] tabular-nums">
          {rupees(amount)} · {quoteId}
        </span>
        <span className="block truncate font-mono text-xs text-faint">{sku}</span>
      </span>
      <span className="shrink-0 text-sm">{status}</span>
    </li>
  );
}
