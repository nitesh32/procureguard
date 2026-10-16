import { CirclePause, ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import { rupees, type Call } from '../feed';

type HeldCardProps = { call: Call; itemName?: string; consoleUrl: string; voice?: ReactNode };

// Read-only: ArmorIQ has no approve API, so the decision is made in its console
// (Intent → Held Actions). The held call resumes on its own once approved.
export function HeldCard({ call, itemName, consoleUrl, voice }: HeldCardProps) {
  const amount = Number(call.args.amount);
  return (
    <div className="animate-slide-in rounded-xl border border-held/40 bg-held/5 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <CirclePause className="h-5 w-5 shrink-0 text-held" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            Waiting for owner approval
            {Number.isFinite(amount) && ` · ${rupees(amount)}`}
          </p>
          <p className="truncate text-xs text-muted">
            ArmorIQ held <code className="font-mono">{call.tool}</code>
            {itemName && ` · ${itemName} ×${String(call.args.qty ?? '')}`}. Nothing is ordered until the owner approves.
          </p>
        </div>
        <a
          href={consoleUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-held px-3 py-1.5 text-sm font-medium text-white hover:bg-held/90"
        >
          Approve in ArmorIQ <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
      {voice}
    </div>
  );
}
