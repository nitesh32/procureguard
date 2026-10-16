import { ArrowUp, Bot, ChevronRight, CornerDownLeft, ShieldAlert, ShieldCheck, ShoppingCart, Sparkles, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Scenario } from '../api';
import { summarize, toCalls, type Call } from '../feed';
import type { Turn } from '../useRun';
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
  renderHeld: (call: Call, turn: Turn) => ReactNode;
};

export function Chat({ turns, scenarios, disabled, onAsk, describe, renderHeld }: ChatProps) {
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
    <section aria-label="Chat with the purchasing agent" className="flex min-h-0 flex-col rounded-2xl border border-line bg-panel shadow-sm">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        {turns.length === 0 ? (
          <Welcome scenarios={scenarios} disabled={disabled} onPick={ask} />
        ) : (
          <ol className="space-y-6">
            {turns.map((turn) => (
              <TurnView key={turn.id} turn={turn} describe={describe} renderHeld={renderHeld} />
            ))}
          </ol>
        )}
        <div ref={bottom} />
      </div>

      <div className="border-t border-line px-6 pt-3 pb-4">
        {turns.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-2" aria-label="Suggested questions">
            {scenarios.map((scenario) => (
              <SuggestionChip key={scenario.id} scenario={scenario} disabled={disabled} onPick={ask} />
            ))}
          </div>
        )}
        <form
          autoComplete="off"
          className="flex items-center gap-2 rounded-xl border border-line bg-panel px-3 py-1.5 shadow-sm focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15"
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
            className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-white disabled:opacity-30"
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
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
        <Sparkles className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="mt-4 text-xl font-semibold">Ask the agent to buy something</h2>
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
              className={`flex items-center gap-3 rounded-xl border bg-panel px-4 py-3 text-left transition hover:-translate-y-px hover:shadow-md disabled:opacity-40 ${
                scenario.expect === 'blocked' ? 'border-blocked/40' : 'border-line'
              }`}
            >
              {look && <look.Icon className={`h-5 w-5 shrink-0 ${look.tone}`} aria-hidden />}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {scenario.id} · {scenario.title}
                </span>
                <span className="block truncate text-xs text-muted">{look?.hint ?? scenario.prompt}</span>
              </span>
              {scenario.expect === 'blocked' && <TriangleAlert className="h-4 w-4 text-blocked" aria-label="attack" />}
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${
        adversarial ? 'border-blocked/40 text-blocked hover:bg-blocked/5' : 'border-line text-ink hover:bg-panel-2'
      }`}
    >
      {scenario.id} · {scenario.title}
      {adversarial && <TriangleAlert className="h-3.5 w-3.5" aria-label="attack" />}
    </button>
  );
}

function TurnView({ turn, describe, renderHeld }: { turn: Turn; describe: (call: Call) => string; renderHeld: ChatProps['renderHeld'] }) {
  const calls = useMemo(() => toCalls(turn.events), [turn.events]);
  const summary = summarize(calls);
  const final = turn.events.find((event) => event.type === 'final');
  const failure = turn.events.find((event) => event.type === 'run_failed');
  const done = !!final || !!failure || !!turn.startError;
  const blocked = calls.find((call) => call.verdict === 'blocked');
  const held = calls.find((call) => call.verdict === 'held');

  return (
    <li className="space-y-3">
      <div className="flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-md bg-brand px-4 py-2 text-sm text-white">{turn.request.prompt}</p>
      </div>

      <div className="flex gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel-2 text-muted">
          <Bot className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <ActionTrace
            calls={calls}
            done={done}
            startedAt={turn.startedAt}
            keepOpen={!!blocked || calls.some((call) => call.wasHeld)}
            summary={summary}
            describe={describe}
          />

          {blocked && (
            <div role="alert" className="flex animate-slide-in items-start gap-2.5 rounded-xl border border-blocked/30 bg-blocked/5 px-4 py-3 text-sm">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-blocked" aria-hidden />
              <p>
                <span className="font-semibold text-blocked">Attack stopped.</span> The agent {lowerFirst(describe(blocked))}. ArmorIQ blocked it before
                it ran; nothing changed.
              </p>
            </div>
          )}
          {held && renderHeld(held, turn)}

          {turn.startError && <p className="text-sm text-blocked">Could not start the run: {turn.startError}</p>}
          {failure && <p className="text-sm text-blocked">Run failed: {String(failure.error)}</p>}
          {final && (
            <div className="answer animate-slide-in text-sm leading-relaxed">
              {/* react-markdown never renders raw HTML: answers can echo attacker-controlled quote text. */}
              <Markdown remarkPlugins={[remarkGfm]}>{String(final.answer ?? '')}</Markdown>
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
    <div className="rounded-xl border border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-muted hover:bg-panel-2"
      >
        <ChevronRight aria-hidden className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
        {done ? (
          <span className="font-medium text-ink">
            Used {summary.total} {summary.total === 1 ? 'tool' : 'tools'}
          </span>
        ) : (
          <span className="text-shimmer font-medium">{calls.length === 0 ? 'Planning' : 'Working'} · ArmorIQ is checking every action</span>
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

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
