import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { RunEvent } from '../api';
import type { summarize } from '../feed';

type AnswerPanelProps = { events: RunEvent[]; running: boolean; startError: string | null; summary: ReturnType<typeof summarize> };

// react-markdown never renders raw HTML, which matters: answers can echo text
// from an attacker-controlled quote document.
export function AnswerPanel({ events, running, startError, summary }: AnswerPanelProps) {
  const final = events.find((event) => event.type === 'final');
  const failure = events.find((event) => event.type === 'run_failed');

  return (
    <section aria-label="Agent answer" className="flex min-h-0 flex-col rounded-xl border border-line bg-panel">
      <h2 className="flex items-center justify-between border-b border-line px-4 py-2 text-xs font-semibold tracking-wider text-muted uppercase">
        Agent answer
        {summary.total > 0 && (
          <span className="normal-case tracking-normal">
            {summary.total} actions · <span className="text-allowed">{summary.allowed} allowed</span> ·{' '}
            <span className="text-held">{summary.held} held</span> · <span className="text-blocked">{summary.blocked} blocked</span>
          </span>
        )}
      </h2>
      <div className="answer min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed">
        {startError && <p className="text-blocked">Could not start the run: {startError}</p>}
        {failure && <p className="text-blocked">Run failed: {String(failure.error)}</p>}
        {!final && !failure && !startError && <p className="text-muted">{running ? 'The agent is working…' : 'The agent’s answer will appear here.'}</p>}
        {final && <Markdown remarkPlugins={[remarkGfm]}>{String(final.answer ?? '')}</Markdown>}
      </div>
    </section>
  );
}
