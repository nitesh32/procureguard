import { ArrowUp } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Scenario } from '../api';
import { toCalls, type Call } from '../feed';
import type { Turn } from '../useRun';
import { StepRow } from './StepRow';

// What each suggested scenario demonstrates, shown on the welcome screen.
const scenarioHint: Record<string, { hint: string; tone: string }> = {
  allowed: { hint: 'Reads stock and quotes. Safe reads are allowed.', tone: 'text-allowed bg-allowed/8 border-allowed/20' },
  held: { hint: 'Places a ₹20,000 order. Money moves are held for the owner.', tone: 'text-held bg-held/8 border-held/20' },
  blocked: { hint: 'The quote hides an instruction to change the bank account.', tone: 'text-blocked bg-blocked/6 border-blocked/20' },
};

// Tables sit in a scrollable white card so wide ones never push the page sideways.
const markdownParts: Components = {
  table: ({ node: _node, ...props }) => (
    <div className="answer-table">
      <table {...props} />
    </div>
  ),
};

type ChatProps = {
  turns: Turn[];
  scenarios: Scenario[];
  disabled: boolean;
  onAsk: (prompt: string) => void;
  describe: (call: Call) => string;
  /** The held and blocked cards for a turn (they need shop data the chat doesn't have). */
  renderCards: (calls: Call[], turn: Turn) => ReactNode;
};

export function Chat({ turns, scenarios, disabled, onAsk, describe, renderCards }: ChatProps) {
  const [prompt, setPrompt] = useState('');
  const bottom = useRef<HTMLDivElement>(null);
  const lastTurn = turns.at(-1);

  // Block body on purpose: newer browsers return a Promise from scrollIntoView, which React would call as a cleanup.
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns.length, lastTurn?.events.length]);

  const ask = (text: string) => {
    if (!text.trim() || disabled) return;
    onAsk(text.trim());
    setPrompt('');
  };

  return (
    <section aria-label="Chat with the purchasing agent" className="flex min-h-0 shrink-0 flex-col lg:shrink">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-10 pb-12 sm:px-8 lg:pt-14">
        <div className="mx-auto max-w-190">
          {turns.length === 0 ? (
            <Welcome scenarios={scenarios} disabled={disabled} onPick={ask} />
          ) : (
            <ol className="space-y-14">
              {turns.map((turn) => (
                <TurnView key={turn.id} turn={turn} describe={describe} renderCards={renderCards} />
              ))}
            </ol>
          )}
          <div ref={bottom} className="scroll-mb-12" />
        </div>
      </div>

      <div className="px-4 pb-5 sm:px-8">
        <div className="mx-auto max-w-190 border-t border-line pt-4">
          <div className="mb-3 flex flex-wrap gap-2" aria-label="Suggested questions">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                disabled={disabled}
                onClick={() => ask(scenario.prompt)}
                title={scenario.prompt}
                className="min-w-0 truncate rounded-full bg-panel-2 px-3 py-1.5 text-[13px] text-muted transition-colors hover:text-ink disabled:opacity-40"
              >
                {scenario.title}
              </button>
            ))}
          </div>
          <form
            autoComplete="off"
            className="flex items-center gap-2 rounded-xl border border-line-strong bg-panel py-1.5 pr-1.5 pl-4 transition-colors focus-within:border-ink"
            onSubmit={(event) => {
              event.preventDefault();
              ask(prompt);
            }}
          >
            <label htmlFor="prompt" className="sr-only">Ask the purchasing agent</label>
            <input
              id="prompt"
              name="agent-prompt"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={disabled ? 'The agent is working…' : 'Ask the purchasing agent…'}
              disabled={disabled}
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] placeholder:text-faint focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={disabled || !prompt.trim()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-ink transition-colors hover:bg-panel-2 disabled:text-faint disabled:hover:bg-transparent"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Welcome({ scenarios, disabled, onPick }: { scenarios: Scenario[]; disabled: boolean; onPick: (prompt: string) => void }) {
  return (
    <div>
      <p className="font-mono text-xs tracking-wider text-faint uppercase">Procurement agent</p>
      <h2 className="mt-3 text-3xl font-medium tracking-tight sm:text-[2.5rem] sm:leading-tight">What should the agent buy today?</h2>
      <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">
        It works on its own. ArmorIQ checks every action before it runs, and holds or blocks the risky ones.
      </p>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {scenarios.map((scenario) => {
          const look = scenarioHint[scenario.expect];
          return (
            <li key={scenario.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(scenario.prompt)}
                className="-mx-3 flex w-[calc(100%+1.5rem)] items-center gap-4 rounded-lg px-3 py-5 text-left transition-colors hover:bg-panel-2/60 disabled:opacity-40"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2.5 text-lg">
                    <span className="truncate">
                      {scenario.id} · {scenario.title}
                    </span>
                    {scenario.expect === 'blocked' && <span className="shrink-0 rounded border border-line-strong px-1.5 font-mono text-xs text-faint">attack</span>}
                  </span>
                  <span className="mt-1 block text-sm text-muted">{look?.hint ?? scenario.prompt}</span>
                </span>
                {look && <span className={`shrink-0 rounded-md border px-2 py-0.5 font-mono text-xs ${look.tone}`}>{scenario.expect}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TurnView({ turn, describe, renderCards }: { turn: Turn; describe: (call: Call) => string; renderCards: ChatProps['renderCards'] }) {
  const calls = useMemo(() => toCalls(turn.events), [turn.events]);
  const final = turn.events.find((event) => event.type === 'final');
  const failure = turn.events.find((event) => event.type === 'run_failed');
  const done = !!final || !!failure || !!turn.startError;
  const elapsed = useElapsed(turn.startedAt, done);
  const waiting = !done && calls.some((call) => call.verdict === 'held');
  const actions = `${calls.length} ${calls.length === 1 ? 'action' : 'actions'}`;

  return (
    <li>
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl bg-ink px-5 py-3 text-[15px] wrap-break-word text-white">{turn.request.prompt}</p>
      </div>

      <p role="status" className="mt-10 text-[13px] text-faint tabular-nums">
        {done ? `${actions} · ${elapsed}s · ArmorIQ checked each one before it ran` : `Working · ArmorIQ is checking every action · ${elapsed}s`}
      </p>
      <ol className="mt-2">
        {calls.length === 0 && !done && <li className="py-2 text-[15px] text-muted">Deciding what to do first…</li>}
        {calls.map((call) => (
          <StepRow key={call.id} call={call} sentence={describe(call)} />
        ))}
      </ol>

      <div className="mt-6 space-y-6 empty:hidden">
        {renderCards(calls, turn)}
        {waiting && <p className="text-sm text-faint italic">Agent is waiting…</p>}
        {turn.startError && <p className="text-sm text-blocked">Could not start the run: {turn.startError}. Check the agent service is running, then try again.</p>}
        {failure && <p className="text-sm text-blocked">Run failed: {String(failure.error)}. Pick the scenario again to retry.</p>}
        {final && (
          <div className="answer text-base leading-relaxed">
            {String(final.answer ?? '').trim() ? (
              // react-markdown never renders raw HTML: answers can echo attacker-controlled quote text.
              <Markdown remarkPlugins={[remarkGfm]} components={markdownParts}>
                {String(final.answer)}
              </Markdown>
            ) : (
              <p className="text-muted">The agent finished without writing a summary. Its {actions} and ArmorIQ’s decisions are listed above.</p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/** Seconds since the turn started; ticks while the agent works, freezes when done. */
function useElapsed(startedAt: number, done: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [done]);
  useEffect(() => {
    if (done) setNow(Date.now());
  }, [done]);
  return Math.max(0, Math.round((now - startedAt) / 1000));
}
