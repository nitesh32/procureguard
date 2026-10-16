import type { Call } from '../feed';
import { VerdictPill } from './VerdictPill';

type BlockedCardProps = {
  call: Call;
  sentence: string;
  supplierName?: string;
  /** The payee account on file now, already masked by the shop. */
  currentAccount?: string;
};

// Same mask as the shop's (mcp-server store): last 4 digits only.
const mask = (accountNumber: string) => `••••${accountNumber.slice(-4)}`;
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

// What ArmorIQ stopped. A bank change shows before/after, Ramp style: payments
// keep going to the verified account and the requested one is never applied.
export function BlockedCard({ call, sentence, supplierName, currentAccount }: BlockedCardProps) {
  const { supplierId, accountNumber } = call.args;
  const summary = `The agent ${lowerFirst(sentence)}. ArmorIQ blocked it before it ran.`;

  if (!supplierId || !accountNumber) {
    return (
      <p role="alert" className="flex flex-wrap items-center gap-2 rounded-lg border border-blocked/40 px-4 py-3 text-sm">
        <VerdictPill verdict="blocked" />
        <span className="min-w-0">{summary} Nothing changed.</span>
      </p>
    );
  }

  const rows: [string, string][] = [
    ['Supplier', supplierName ?? String(supplierId)],
    ['Payments still go to', `${currentAccount ?? 'the account on file'} (unchanged)`],
    ['Requested', `${mask(String(accountNumber))} — not applied`],
    ['Decided by', `ArmorIQ policy${call.reason ? ` (${call.reason})` : ''}`],
  ];

  return (
    <section role="alert" aria-label="Blocked attempt" className="rounded-lg border border-blocked/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <VerdictPill verdict="blocked" />
        <h3 className="text-[15px] font-semibold">Bank change blocked</h3>
      </div>
      <p className="mt-1 text-sm text-muted">{summary}</p>
      <dl className="mt-3 grid grid-cols-[9rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-xs leading-5 font-medium text-muted">{label}</dt>
            <dd className="min-w-0 break-words tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
