import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { Call } from '../feed';
import { VerdictPill } from './VerdictPill';

const reasonText: Record<string, string> = {
  tool_denied: 'ArmorIQ policy blocks this tool',
  rule_action_hold: 'ArmorIQ policy holds this tool for human approval',
  no_matching_policy: 'No ArmorIQ policy covers this tool (fails closed)',
};

const decidedBy = (call: Call) =>
  call.verdict === 'error' ? `ArmorIQ check failed, so it fails closed: ${call.reason ?? 'no details'}` : call.reason ? (reasonText[call.reason] ?? call.reason) : call.verdict === 'allowed' ? 'ArmorIQ policy allows this tool' : 'No decision yet';

// One tool call inside the chat: plain sentence first, raw details on demand.
export function StepRow({ step, call, sentence }: { step: number; call: Call; sentence: string }) {
  const [open, setOpen] = useState(false);
  const blocked = call.verdict === 'blocked';

  return (
    <li className={`rounded-md ${blocked ? 'bg-blocked/5' : ''}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-panel-2"
      >
        <span className="w-5 shrink-0 text-right font-mono text-[11px] text-muted tabular-nums">{step}</span>
        <ChevronRight aria-hidden className={`h-3.5 w-3.5 shrink-0 text-muted ${open ? 'rotate-90' : ''}`} />
        <span className={`min-w-0 flex-1 truncate text-sm ${blocked ? 'font-medium text-blocked' : ''}`}>{sentence}</span>
        <code className="hidden shrink-0 font-mono text-[11px] text-muted xl:inline">{call.tool}</code>
        <VerdictPill verdict={call.verdict} />
      </button>
      {open && (
        <div className="space-y-1.5 pr-3 pb-2 pl-14 text-xs">
          <p className="text-muted">
            Decided by <span className="text-ink">{decidedBy(call)}</span>
            {call.reason && <span className="ml-1.5 font-mono">({call.reason})</span>}
            <span className="ml-2">· {new Date(call.startedAt).toLocaleTimeString('en-GB')}</span>
          </p>
          <pre className="overflow-x-auto rounded-md bg-panel-2 p-2 font-mono text-[11px] text-muted">{JSON.stringify(call.args, null, 2)}</pre>
        </div>
      )}
    </li>
  );
}
