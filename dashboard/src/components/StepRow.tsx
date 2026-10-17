import { useState } from 'react';
import { clock, type Call } from '../feed';
import { VerdictGlyph, VerdictWord } from './Verdict';

const reasonText: Record<string, string> = {
  tool_denied: 'ArmorIQ policy blocks this tool',
  rule_action_hold: 'ArmorIQ policy holds this tool for human approval',
  no_matching_policy: 'No ArmorIQ policy covers this tool (fails closed)',
};

const decidedBy = (call: Call) =>
  call.verdict === 'error' ? `ArmorIQ check failed, so it fails closed: ${call.reason ?? 'no details'}` : call.reason ? (reasonText[call.reason] ?? call.reason) : call.verdict === 'allowed' ? 'ArmorIQ policy allows this tool' : 'No decision yet';

const sentenceTone: Partial<Record<Call['verdict'], string>> = { blocked: 'text-blocked', held: 'text-held' };

// One tool call: time, glyph, plain sentence, tool and ArmorIQ's word. Raw details on demand.
export function StepRow({ call, sentence }: { call: Call; sentence: string }) {
  const [open, setOpen] = useState(false);

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="-mx-2 flex w-[calc(100%+1rem)] min-w-0 items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-panel-2/60"
      >
        <time className="hidden shrink-0 font-mono text-xs text-faint tabular-nums sm:inline">{clock(call.startedAt)}</time>
        <VerdictGlyph verdict={call.verdict} />
        <span className={`min-w-0 flex-1 truncate text-[15px] ${sentenceTone[call.verdict] ?? ''}`}>{sentence}</span>
        <code className="hidden min-w-0 shrink truncate font-mono text-xs text-faint sm:inline">{call.tool}</code>
        <VerdictWord verdict={call.verdict} />
      </button>
      {open && (
        <div className="space-y-2 pt-1 pb-3 text-xs sm:pl-[5.75rem]">
          <p className="text-muted">
            Decided by <span className="text-ink">{decidedBy(call)}</span>
            {call.reason && <span className="ml-1.5 font-mono">({call.reason})</span>}
          </p>
          <pre className="overflow-x-auto rounded-md bg-panel-2/70 p-3 font-mono text-xs text-muted">{call.tool} {JSON.stringify(call.args, null, 2)}</pre>
        </div>
      )}
    </li>
  );
}
