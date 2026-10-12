import type { ShopState } from '../api';

const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-stone-300 bg-white">
      <h2 className="border-b border-stone-200 px-4 py-2 text-sm font-semibold">{title}</h2>
      <div className="px-4 py-2 text-sm">{children}</div>
    </section>
  );
}

export function ShopPanels({ state }: { state: ShopState | null }) {
  if (!state) return <p className="text-sm text-stone-500">Loading shop data…</p>;

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Suppliers · payee account">
        <ul className="divide-y divide-stone-100">
          {state.suppliers.map((supplier) => (
            <li key={supplier.id} className="flex justify-between gap-2 py-1.5">
              <span>{supplier.name}</span>
              <span className="font-mono text-xs text-stone-600">{supplier.payee?.accountNumberMasked ?? 'no payee'}</span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Inventory">
        <table className="w-full">
          <tbody className="divide-y divide-stone-100">
            {state.inventory.map((item) => {
              const low = item.stock < item.reorderLevel;
              return (
                <tr key={item.sku}>
                  <td className="py-1.5">{item.name}</td>
                  <td className={`py-1.5 text-right font-mono text-xs tabular-nums ${low ? 'font-semibold text-red-700' : 'text-stone-600'}`}>
                    {item.stock} / {item.reorderLevel}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      <Panel title={`Orders (${state.orders.length})`}>
        {state.orders.length === 0 ? (
          <p className="py-1.5 text-stone-500">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {state.orders.map((order) => (
              <li key={order.id} className="flex justify-between py-1.5">
                <span className="font-mono text-xs">
                  {order.id} · {order.sku}
                </span>
                <span className="tabular-nums">{rupees(order.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {state.reviewFlags.length > 0 && (
        <Panel title="Flagged for review">
          <ul className="divide-y divide-stone-100">
            {state.reviewFlags.map((flag) => (
              <li key={flag.id} className="py-1.5">
                <span className="font-mono text-xs">{flag.entityId}</span> · {flag.reason}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
