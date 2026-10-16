import { useState } from 'react';
import type { Call } from '../feed';
import { VerdictPill } from './VerdictPill';

const reasonText: Record<string, string> = {
  tool_denied: 'ArmorIQ policy blocks this tool',
  rule_action_hold: 'ArmorIQ policy holds this tool for human approval',
  no_matching_policy: 'No ArmorIQ policy covers this tool (fails closed)',
};

type TimelineProps = { calls: Call[]; describe: (call: Call) => string };

export function Timeline({ calls, describe }: TimelineProps) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <section aria-label="Timeline" className="flex min-h-0 flex-col rounded-xl border border-line bg-panel">
      <h2 className="border-b border-line px-4 py-2 text-xs font-semibold tracking-wider text-muted uppercase">Timeline</h2>
      <ol className="min-h-0 flex-1 divide-y divide-line overflow-y-auto">
        {calls.length === 0 && <li className="px-4 py-4 text-sm text-muted">Every action the agent tries will appear here.</li>}
        {calls.map((call) => {
          const expanded = open === call.id;
          return (
            <li key={call.id} className={call.verdict === 'blocked' ? 'bg-blocked/5' : ''}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : call.id)}
                className="grid w-full grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2 text-left hover:bg-panel-2 focus-visible:bg-panel-2 focus-visible:outline-none"
              >
                <time className="font-mono text-xs text-muted">{new Date(call.startedAt).toLocaleTimeString('en-GB')}</time>
                <span className="min-w-0">
                  <span className="block truncate text-sm">{describe(call)}</span>
                  <span className="block truncate font-mono text-xs text-muted">{call.tool}</span>
                </span>
                <VerdictPill verdict={call.verdict} />
              </button>
              {expanded && (
                <div className="space-y-2 px-4 pb-3 pl-[5.25rem] text-xs">
                  <p className="text-muted">
                    Decided by: <span className="text-ink">{call.reason ? reasonText[call.reason] ?? call.reason : call.verdict === 'allowed' ? 'ArmorIQ policy allows this tool' : '—'}</span>
                    {call.reason && <span className="ml-2 font-mono text-muted">({call.reason})</span>}
                  </p>
                  <pre className="overflow-x-auto rounded-md bg-ground p-2 font-mono text-[11px] text-muted">{JSON.stringify(call.args, null, 2)}</pre>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
