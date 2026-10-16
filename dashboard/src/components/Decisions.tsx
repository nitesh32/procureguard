import { Ban, Check, CirclePause } from 'lucide-react';
import type { Call, Verdict, summarize } from '../feed';
import { ArmorIQMark } from './ArmorIQMark';
import { VerdictPill } from './VerdictPill';

// What happened to the newest call, in plain words.
const outcome: Record<Verdict, string> = {
  checking: 'ArmorIQ is checking it…',
  allowed: 'Ran — allowed by policy',
  approved: 'Ran — approved by the owner',
  held: 'Waiting — held for the owner’s approval',
  rejected: 'Not run — not approved',
  blocked: 'Not run — blocked before it reached the shop',
  failed: 'Allowed, but the tool returned an error',
  'no-verdict': 'No ArmorIQ decision recorded',
};

type DecisionsProps = { summary: ReturnType<typeof summarize>; latest?: Call };

// ArmorIQ's decisions for the whole conversation, and the newest one.
export function Decisions({ summary, latest }: DecisionsProps) {
  const counts = [
    { Icon: Check, value: summary.allowed, label: 'allowed', tone: 'text-allowed' },
    { Icon: CirclePause, value: summary.held, label: 'held', tone: 'text-held' },
    { Icon: Ban, value: summary.blocked, label: 'blocked', tone: 'text-blocked' },
  ];
  return (
    <section aria-labelledby="decisions-title" className="border-b border-line px-4 py-4 sm:px-6">
      <h2 id="decisions-title" className="flex items-center gap-1.5 text-sm font-semibold">
        <ArmorIQMark className="h-4 w-4" /> ArmorIQ decisions
      </h2>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {counts.map(({ Icon, value, label, tone }) => (
          <span key={label} className="flex items-center gap-1.5">
            <Icon className={`h-4 w-4 ${tone}`} aria-hidden />
            <span className="font-semibold tabular-nums">{value}</span>
            <span className="text-muted">{label}</span>
          </span>
        ))}
      </p>
      <div aria-live="polite" className="mt-3 text-sm">
        {latest ? (
          <>
            <p className="flex min-w-0 items-center gap-2">
              <span className="text-xs font-medium text-muted">Latest</span>
              <VerdictPill verdict={latest.verdict} />
              <code className="min-w-0 truncate font-mono text-xs">{latest.tool}</code>
            </p>
            <p className="mt-1 text-muted">{outcome[latest.verdict]}</p>
          </>
        ) : (
          <p className="text-muted">Waiting for the agent’s first action.</p>
        )}
      </div>
    </section>
  );
}
