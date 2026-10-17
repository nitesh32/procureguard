import { ArrowUpRight, Clock } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { clock, rupees, type Call } from '../feed';

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

// An approval request. Read-only: ArmorIQ has no approve API, so the decision
// is made in its console (Intent → Held Actions); the call resumes on its own.
export function HeldCard({ call, itemName, why, waitSeconds, decision, consoleUrl, voice }: HeldCardProps) {
  const heldAt = call.heldAt ?? call.startedAt;
  const timeLeft = useTimeLeft(heldAt + waitSeconds * 1000, call.verdict === 'held');
  const amount = Number(call.args.amount);
  const amountText = <span className="font-mono font-medium tabular-nums">{Number.isFinite(amount) ? rupees(amount) : '—'}</span>;

  if (call.verdict === 'approved') {
    return (
      <Card border="border-line-strong" dot="bg-allowed" title="Approved by the owner · the order went ahead">
        <Facts rows={[['Amount', amountText]]} />
      </Card>
    );
  }

  if (call.verdict !== 'held') {
    return (
      <Card border="border-line-strong" dot="bg-faint" title="Not approved in time · nothing was ordered">
        <Facts
          rows={[
            ['Amount', amountText],
            ['Held at', <span className="font-mono tabular-nums">{clock(heldAt)}</span>],
            ['Window', <span className="font-mono tabular-nums">{waitSeconds}s</span>],
          ]}
        />
        <Footer>
          <span>Approve it in the ArmorIQ console and ask again to place the order.</span>
          <ConsoleLink href={consoleUrl} />
        </Footer>
      </Card>
    );
  }

  const rows: [string, ReactNode][] = [
    ['Item', `${itemName ?? String(call.args.sku ?? '')} × ${String(call.args.qty ?? '')}`],
    ['Amount', amountText],
    ['Supplier quote', <span className="font-mono">{String(call.args.quoteId ?? '—')}</span>],
    ['Requested by', 'Shop manager'],
    ['Why held', `Policy — ${why}`],
  ];

  return (
    <Card
      label="Approval request"
      border="border-held/25"
      dot="bg-held"
      title="Waiting for owner approval"
      aside={
        <span role="timer" className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-held/25 bg-held/6 px-2.5 py-0.5 font-mono text-xs text-held tabular-nums">
          <Clock className="h-3.5 w-3.5" aria-hidden /> {timeLeft} left
        </span>
      }
    >
      <Facts rows={rows} />
      <div className="mt-6 border-t border-line pt-5">
        <p className="text-sm text-muted">Nothing is ordered until the owner approves.</p>
        {decision && (
          <p role="status" className="mt-2 text-sm font-medium">
            Owner said {decision === 'approve' ? 'yes' : 'no'} on the call. {decision === 'approve' ? 'Confirm' : 'Reject'} it in the ArmorIQ console.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={consoleUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink-hover"
          >
            Approve in ArmorIQ Console <ArrowUpRight className="h-4 w-4" aria-hidden />
          </a>
          {voice}
        </div>
      </div>
      <Footer>
        <span>
          ArmorIQ reason: {call.reason ?? 'held'} · {clock(heldAt)}
        </span>
      </Footer>
    </Card>
  );
}

type CardProps = { label?: string; border: string; dot: string; title: string; aside?: ReactNode; alert?: boolean; children: ReactNode };

/** The one focal card style: white, soft coloured border, a dot and a title. Shared with BlockedCard. */
export function Card({ label, border, dot, title, aside, alert, children }: CardProps) {
  return (
    <section role={alert ? 'alert' : undefined} aria-label={label ?? title} className={`rounded-xl border bg-panel p-5 sm:p-7 ${border}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        <h3 className="min-w-0 flex-1 text-lg font-medium">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Grey footnote row under a hairline. */
export function Footer({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4 text-[13px] text-faint">{children}</div>;
}

export function ConsoleLink({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-ink">
      Open in ArmorIQ console <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    </a>
  );
}

/** Label left, value right; stacked on narrow screens. */
function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="mt-5 space-y-3 text-[15px]">
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-wrap justify-between gap-x-6 gap-y-0.5">
          <dt className="text-muted">{label}</dt>
          <dd className="min-w-0 text-right wrap-break-word tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** m:ss until the deadline, ticking once a second while active. */
function useTimeLeft(deadline: number, active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active]);
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
