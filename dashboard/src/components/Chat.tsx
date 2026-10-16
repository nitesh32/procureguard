import { ArrowUp, ChevronRight, CornerDownLeft, ShieldAlert, ShieldCheck, ShoppingCart } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Scenario } from '../api';
import { summarize, toCalls, type Call } from '../feed';
import type { Turn } from '../useRun';
import { AgentAvatar } from './AgentAvatar';
import { ArmorIQMark } from './ArmorIQMark';
import { StepRow } from './StepRow';

// What each suggested scenario demonstrates, shown on the welcome screen.
const scenarioHint: Record<string, { hint: string; Icon: typeof ShieldCheck; tone: string }> = {
  allowed: { hint: 'Safe reads: ArmorIQ allows them', Icon: ShieldCheck, tone: 'text-allowed' },
  held: { hint: 'Money moves: held for owner approval', Icon: ShoppingCart, tone: 'text-held' },
  blocked: { hint: 'Poisoned quote: an attack ArmorIQ must stop', Icon: ShieldAlert, tone: 'text-blocked' },
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
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {turns.length === 0 ? (
          <Welcome scenarios={scenarios} disabled={disabled} onPick={ask} />
        ) : (
          <ol className="space-y-6">
            {turns.map((turn) => (
              <TurnView key={turn.id} turn={turn} describe={describe} renderCards={renderCards} />
            ))}
          </ol>
        )}
        <div ref={bottom} />
      </div>

      <div className="border-t border-line px-4 pt-3 pb-4 sm:px-6">
        {turns.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-2" aria-label="Suggested questions">
            {scenarios.map((scenario) => (
              <SuggestionChip key={scenario.id} scenario={scenario} disabled={disabled} onPick={ask} />
            ))}
          </div>
        )}
        <form
          autoComplete="off"
          className="flex items-center gap-2 rounded-lg border border-line bg-panel py-1 pr-1 pl-3 transition-colors focus-within:border-ink"
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
            placeholder={disabled ? 'The agent is working…' : 'Ask the purchasing agent to check stock, order parts or process a quote…'}
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm placeholder:text-muted focus:outline-none"
          />
          <kbd className="hidden items-center gap-1 text-[11px] text-muted sm:flex" aria-hidden>
            <CornerDownLeft className="h-3 w-3" /> to send
          </kbd>
          <button
            type="submit"
            aria-label="Send"
            disabled={disabled || !prompt.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-ink text-white transition-colors hover:bg-ink-hover disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </button>
        </form>
      </div>
    </section>
  );
}

function Welcome({ scenarios, disabled, onPick }: { scenarios: Scenario[]; disabled: boolean; onPick: (prompt: string) => void }) {
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
      <AgentAvatar size="lg" />
      <p className="mt-3 text-xs font-medium tracking-wider text-muted uppercase">Procurement agent</p>
      <h2 className="mt-1 text-xl font-semibold">Ask the agent to buy something</h2>
      <p className="mt-1 text-sm text-muted">It works on its own. ArmorIQ checks every action before it runs, and holds or blocks the risky ones.</p>
      <div className="mt-6 grid w-full gap-2.5">
        {scenarios.map((scenario) => {
          const look = scenarioHint[scenario.expect];
          return (
            <button
              key={scenario.id}
              type="button"
              disabled={disabled}
              onClick={() => onPick(scenario.prompt)}
              className="flex min-h-10 items-center gap-3 rounded-lg border border-line px-4 py-3 text-left transition-colors hover:bg-panel-2 disabled:opacity-40"
            >
              {look && <look.Icon className={`h-5 w-5 shrink-0 ${look.tone}`} aria-hidden />}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium capitalize">
                  {scenario.id} · {scenario.title}
                </span>
                <span className={`block truncate text-xs ${scenario.expect === 'blocked' ? 'text-blocked' : 'text-muted'}`}>{look?.hint ?? scenario.prompt}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SuggestionChip({ scenario, disabled, onPick }: { scenario: Scenario; disabled: boolean; onPick: (prompt: string) => void }) {
  const adversarial = scenario.expect === 'blocked';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPick(scenario.prompt)}
      title={scenario.prompt}
      className={`inline-flex min-w-0 items-center rounded-md border border-line px-3 py-1.5 text-xs font-medium capitalize transition-colors hover:bg-panel-2 disabled:opacity-40 ${
        adversarial ? 'text-blocked' : 'text-ink'
      }`}
    >
      <span className="truncate">
        {scenario.id} · {scenario.title}
      </span>
    </button>
  );
}

function TurnView({ turn, describe, renderCards }: { turn: Turn; describe: (call: Call) => string; renderCards: ChatProps['renderCards'] }) {
  const calls = useMemo(() => toCalls(turn.events), [turn.events]);
  const summary = summarize(calls);
  const final = turn.events.find((event) => event.type === 'final');
  const failure = turn.events.find((event) => event.type === 'run_failed');
  const done = !!final || !!failure || !!turn.startError;
  const blocked = calls.find((call) => call.verdict === 'blocked');

  return (
    <li className="space-y-3">
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-lg bg-ink px-4 py-2 text-sm break-words text-white">{turn.request.prompt}</p>
      </div>

      <div className="flex gap-3">
        <AgentAvatar working={!done} />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Procurement agent</span>
            <span className="flex items-center gap-1 text-xs text-muted">
              · guarded by <ArmorIQMark className="h-3.5 w-3.5" /> ArmorIQ
            </span>
          </p>
          <ActionTrace
            calls={calls}
            done={done}
            startedAt={turn.startedAt}
            keepOpen={!!blocked || calls.some((call) => call.wasHeld)}
            summary={summary}
            describe={describe}
          />

          {renderCards(calls, turn)}

          {turn.startError && <p className="text-sm text-blocked">Could not start the run: {turn.startError}. Check the agent service is running, then try again.</p>}
          {failure && <p className="text-sm text-blocked">Run failed: {String(failure.error)}. Pick the scenario again to retry.</p>}
          {final && (
            <div className="answer text-sm leading-relaxed">
              {String(final.answer ?? '').trim() ? (
                // react-markdown never renders raw HTML: answers can echo attacker-controlled quote text.
                <Markdown remarkPlugins={[remarkGfm]}>{String(final.answer)}</Markdown>
              ) : (
                <p className="text-muted">
                  The agent finished without writing a summary. Its {summary.total} actions and ArmorIQ’s decisions are listed above.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

type ActionTraceProps = {
  calls: Call[];
  done: boolean;
  startedAt: number;
  keepOpen: boolean;
  summary: ReturnType<typeof summarize>;
  describe: (call: Call) => string;
};

// The agent's actions for one turn. Open while working; collapses to a one-line
// summary when done, unless ArmorIQ held or blocked something (that is the story).
function ActionTrace({ calls, done, startedAt, keepOpen, summary, describe }: ActionTraceProps) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    if (done && !keepOpen) setOpen(false);
  }, [done, keepOpen]);
  const elapsed = useElapsed(startedAt, done);

  return (
    <div className="rounded-lg border border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-lg px-3 py-2 text-left text-xs text-muted transition-colors hover:bg-panel-2"
      >
        <ChevronRight aria-hidden className={`h-3.5 w-3.5 ${open ? 'rotate-90' : ''}`} />
        {done ? (
          <span className="font-medium text-ink">
            Used {summary.total} {summary.total === 1 ? 'tool' : 'tools'}
          </span>
        ) : (
          <span className="font-medium text-ink">{calls.length === 0 ? 'Planning' : 'Working'} · ArmorIQ is checking every action</span>
        )}
        <span className="tabular-nums">· {elapsed}s</span>
        {summary.total > 0 && (
          <span className="ml-auto flex gap-2">
            <span className="text-allowed">{summary.allowed} allowed</span>
            {summary.held > 0 && <span className="text-held">{summary.held} held</span>}
            {summary.blocked > 0 && <span className="text-blocked">{summary.blocked} blocked</span>}
          </span>
        )}
      </button>
      {open && (
        <ol className="border-t border-line p-1">
          {calls.length === 0 && !done && <li className="px-2 py-1.5 text-sm text-muted">Deciding what to do first…</li>}
          {calls.map((call, index) => (
            <StepRow key={call.id} step={index + 1} call={call} sentence={describe(call)} />
          ))}
        </ol>
      )}
    </div>
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
