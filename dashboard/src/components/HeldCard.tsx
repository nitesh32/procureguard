import type { ReactNode } from 'react';
import { rupees, type Call } from '../feed';

type HeldCardProps = { call: Call; itemName?: string; consoleUrl: string; voice?: ReactNode };

// Read-only: ArmorIQ has no approve API, so the decision is made in its console
// (Intent → Held Actions). The held call resumes on its own once approved.
export function HeldCard({ call, itemName, consoleUrl, voice }: HeldCardProps) {
  const amount = Number(call.args.amount);
  return (
    <div className="animate-slide-in rounded-lg border border-held/60 bg-ground/95 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-held" aria-hidden />
        <p className="text-sm font-semibold text-held">
          <span className="font-mono">{call.tool}</span>
          {Number.isFinite(amount) && ` · ${rupees(amount)}`}
          {itemName && ` · ${itemName} ×${String(call.args.qty ?? '')}`}
          {' · Waiting for owner approval'}
        </p>
        <a href={consoleUrl} target="_blank" rel="noreferrer" className="ml-auto rounded-md border border-held/60 px-3 py-1 text-sm font-medium text-held hover:bg-held/10">
          Approve in ArmorIQ console ↗
        </a>
      </div>
      {voice}
    </div>
  );
}
