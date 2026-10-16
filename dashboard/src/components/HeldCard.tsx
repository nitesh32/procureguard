import { Check, ExternalLink, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { rupees, type Call } from '../feed';
import { VerdictPill } from './VerdictPill';

type HeldCardProps = {
  call: Call;
  itemName?: string;
  why: string;
  waitSeconds: number;
  /** What the owner said on the voice call, if they answered. */
  decision?: 'approve' | 'reject';
  consoleUrl: string;
  voice?: ReactNode;
};

// An approval request, Ramp style. Read-only: ArmorIQ has no approve API, so the
// decision is made in its console (Intent → Held Actions); the call resumes on its own.
export function HeldCard({ call, itemName, why, waitSeconds, decision, consoleUrl, voice }: HeldCardProps) {
  const timeLeft = useTimeLeft((call.decidedAt ?? call.startedAt) + waitSeconds * 1000, call.verdict === 'held');

  if (call.verdict !== 'held') {
    const approved = call.verdict === 'approved';
    return (
      <p className="flex items-center gap-2 rounded-lg border border-line px-4 py-3 text-sm">
        {approved ? <Check className="h-4 w-4 shrink-0 text-allowed" aria-hidden /> : <X className="h-4 w-4 shrink-0 text-blocked" aria-hidden />}
        <span className="min-w-0">
          {approved ? 'Approved by the owner in ArmorIQ · the order went ahead' : 'Not approved in time · nothing was ordered'}
        </span>
      </p>
    );
  }

  const amount = Number(call.args.amount);
  const rows: [string, ReactNode][] = [
    ['Item', `${itemName ?? String(call.args.sku ?? '')} × ${String(call.args.qty ?? '')}`],
    ['Amount', <span className="font-semibold tabular-nums">{Number.isFinite(amount) ? rupees(amount) : '—'}</span>],
    ['Requested by', 'Shop manager'],
    ['Why held', `Policy: ${why}`],
    ['Time left', <span className="font-mono tabular-nums">{timeLeft}</span>],
  ];

  return (
    <section aria-label="Approval request" className="rounded-lg border border-held/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <VerdictPill verdict="held" />
        <h3 className="text-[15px] font-semibold">Approval needed</h3>
      </div>
      <p className="mt-1 text-sm text-muted">ArmorIQ held this purchase order. Nothing is ordered until the owner approves it.</p>

      <dl className="mt-3 grid grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-xs leading-5 font-medium text-muted">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </div>
        ))}
      </dl>

      {decision && (
        <p role="status" className="mt-3 text-sm font-medium">
          Owner said {decision === 'approve' ? 'yes' : 'no'} on the call. {decision === 'approve' ? 'Confirm' : 'Reject'} it in the ArmorIQ console.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={consoleUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink-hover"
        >
          Approve in ArmorIQ Console <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
        {voice}
      </div>
    </section>
  );
}

/** mm:ss until the deadline, ticking once a second while active. */
function useTimeLeft(deadline: number, active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}
