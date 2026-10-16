import { useEffect, useState, type ReactNode } from 'react';
import type { Call } from '../feed';

// The hero: Request → Agent → ArmorIQ gate → Tool → Effect. Every tool call is a
// packet that travels the pipeline; where it stops shows ArmorIQ's verdict.

const x = { request: 8, agent: 28, gate: 50, tool: 72, effect: 91 };
const packetX: Record<Call['verdict'], number> = {
  checking: 42,
  held: x.gate,
  blocked: 45,
  allowed: x.effect,
  approved: x.effect,
  rejected: x.gate,
  failed: x.gate,
  'no-verdict': x.gate,
};
const lingerMs = 1600; // how long a resolved packet stays visible
const lanes = 4;

const packetColour: Record<Call['verdict'], string> = {
  checking: 'border-checking/60 bg-panel-2 text-checking',
  held: 'border-held bg-held/20 text-held',
  blocked: 'border-blocked bg-blocked/25 text-blocked animate-shake',
  allowed: 'border-allowed bg-allowed/20 text-allowed',
  approved: 'border-allowed bg-allowed/20 text-allowed',
  rejected: 'border-muted bg-panel-2 text-muted opacity-0',
  failed: 'border-muted bg-panel-2 text-muted opacity-0',
  'no-verdict': 'border-muted bg-panel-2 text-muted opacity-0',
};

type AgentFlowProps = {
  calls: Call[];
  idle: boolean;
  attackBanner?: string;
  heldCard?: ReactNode;
};

export function AgentFlow({ calls, idle, attackBanner, heldCard }: AgentFlowProps) {
  const now = useNow(calls.length > 0);
  const recent = (call: Call) => call.decidedAt !== undefined && now - call.decidedAt < lingerMs;

  const visible = calls.filter((call) => call.verdict === 'checking' || call.verdict === 'held' || recent(call));
  const checking = calls.some((call) => call.verdict === 'checking');
  const held = calls.some((call) => call.verdict === 'held');
  const justBlocked = calls.find((call) => call.verdict === 'blocked' && recent(call));
  const justAllowed = [...calls].reverse().find((call) => (call.verdict === 'allowed' || call.verdict === 'approved') && recent(call));

  const gateTone = justBlocked ? 'blocked' : held ? 'held' : checking ? 'checking' : 'idle';

  return (
    <section aria-label="Agent flow" className="relative h-full overflow-hidden rounded-xl border border-line bg-panel">
      <div className={`absolute inset-0 ${idle ? 'opacity-30' : ''}`}>
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden>
          {[
            [x.request, x.agent],
            [x.agent, x.gate],
            [x.gate, x.tool],
            [x.tool, x.effect],
          ].map(([from, to]) => (
            <line key={from} x1={from} y1="50" x2={to} y2="50" stroke="var(--color-line)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" strokeDasharray="4 4" />
          ))}
        </svg>

        <FlowNode at={x.request} title="Request" subtitle="from the shop" />
        <FlowNode at={x.agent} title="Agent" subtitle="LLM picks tools" />
        <Gate tone={gateTone} />
        <FlowNode at={x.tool} title={justAllowed ? justAllowed.tool : 'Tool'} subtitle="MCP server" mono={!!justAllowed} glow={justAllowed ? 'allowed' : undefined} />
        <FlowNode at={x.effect} title="Effect" subtitle="Inventory · Orders · Suppliers" glow={justAllowed ? 'allowed' : undefined} />

        {visible.map((call) => (
          <Packet key={call.id} call={call} lane={calls.indexOf(call) % lanes} />
        ))}

        {justBlocked && (
          <p className="absolute left-1/2 top-[78%] -translate-x-1/2 animate-slide-in whitespace-nowrap rounded-md bg-blocked/15 px-3 py-1 text-sm font-semibold text-blocked">
            ⛔ Blocked by policy: <span className="font-mono">{justBlocked.tool}</span>
          </p>
        )}
      </div>

      {attackBanner && (
        <div role="alert" className="absolute inset-x-3 top-3 animate-slide-in rounded-lg border border-blocked/60 bg-blocked/15 px-4 py-2 text-sm font-semibold text-blocked">
          ⛔ {attackBanner}
        </div>
      )}

      {heldCard && <div className="absolute inset-x-3 bottom-3">{heldCard}</div>}

      {idle && (
        <p className="absolute inset-x-0 bottom-6 text-center text-base text-muted">Pick a scenario to watch the agent work</p>
      )}
    </section>
  );
}

function FlowNode({ at, title, subtitle, mono, glow }: { at: number; title: string; subtitle: string; mono?: boolean; glow?: 'allowed' }) {
  return (
    <div
      className={`absolute top-1/2 w-[15%] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-panel-2 px-3 py-2 text-center transition-colors duration-300 ${
        glow ? 'border-allowed shadow-[0_0_24px_-6px_var(--color-allowed)]' : 'border-line'
      }`}
      style={{ left: `${at}%` }}
    >
      <p className={`truncate text-sm font-semibold ${mono ? 'font-mono text-allowed' : ''}`}>{title}</p>
      <p className="truncate text-[11px] text-muted">{subtitle}</p>
    </div>
  );
}

const gateLook = {
  idle: { ring: 'var(--color-line)', label: 'ArmorIQ policy gate', text: 'text-ink' },
  checking: { ring: 'var(--color-checking)', label: 'checking…', text: 'text-checking' },
  held: { ring: 'var(--color-held)', label: '⏸ held for approval', text: 'text-held' },
  blocked: { ring: 'var(--color-blocked)', label: '⛔ blocked', text: 'text-blocked' },
};

function Gate({ tone }: { tone: keyof typeof gateLook }) {
  const look = gateLook[tone];
  return (
    <div className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: `${x.gate}%` }}>
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="absolute inset-0" aria-hidden>
          <circle cx="50" cy="50" r="44" fill="var(--color-panel-2)" stroke={look.ring} strokeWidth="3" className={tone === 'held' ? 'animate-ring' : ''} />
          {tone === 'checking' && (
            <circle cx="50" cy="50" r="44" fill="none" stroke={look.ring} strokeWidth="5" strokeDasharray="60 220" strokeLinecap="round" className="animate-scan" />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[11px] font-semibold tracking-wider text-muted">ARMORIQ</span>
          <span className="text-lg" aria-hidden>{tone === 'held' ? '🔒' : tone === 'blocked' ? '⛔' : '🛡'}</span>
        </div>
      </div>
      <p className={`mt-1 text-xs font-semibold ${look.text}`}>{look.label}</p>
    </div>
  );
}

function Packet({ call, lane }: { call: Call; lane: number }) {
  // Start at the agent, then move to where the verdict puts the packet.
  const [left, setLeft] = useState(x.agent);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setLeft(packetX[call.verdict]));
    return () => cancelAnimationFrame(frame);
  }, [call.verdict]);

  return (
    <span
      className={`packet absolute -translate-x-1/2 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-mono text-xs font-medium ${packetColour[call.verdict]}`}
      style={{ left: `${left}%`, top: `calc(22% + ${lane * 22}px)` }}
    >
      {call.tool}
    </span>
  );
}

/** Re-renders every 200 ms while there is something to animate. */
function useNow(active: boolean) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}
