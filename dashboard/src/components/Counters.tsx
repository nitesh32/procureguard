import { useEffect, useRef, useState } from 'react';
import { rupees, type summarize } from '../feed';

type CountersProps = { summary: ReturnType<typeof summarize> };

export function Counters({ summary }: CountersProps) {
  return (
    <footer className="grid grid-cols-4 gap-3 px-6 pb-4">
      <Counter label="Allowed" icon="✓" value={summary.allowed} tone="text-allowed" />
      <Counter label="Held for approval" icon="⏸" value={summary.held} tone="text-held" />
      <Counter label="Blocked" icon="⛔" value={summary.blocked} tone="text-blocked" />
      <Counter label="₹ protected" icon="🛡" value={summary.protectedAmount} tone="text-ink" format={rupees} />
    </footer>
  );
}

function Counter({ label, icon, value, tone, format = String }: { label: string; icon: string; value: number; tone: string; format?: (n: number) => string }) {
  const shown = useCountUp(value);
  return (
    <div className="flex items-baseline justify-between rounded-xl border border-line bg-panel px-4 py-2.5">
      <span className="text-sm text-muted">
        <span aria-hidden className="mr-1.5">{icon}</span>
        {label}
      </span>
      <span className={`font-mono text-2xl font-bold tabular-nums ${tone}`}>{format(shown)}</span>
    </div>
  );
}

/** Animates a number from its previous value to the new one (instant with reduced motion). */
function useCountUp(target: number, durationMs = 400) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const step = (time: number) => {
      const progress = Math.min(1, (time - start) / durationMs);
      setShown(Math.round(origin + (target - origin) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
      else from.current = target;
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return shown;
}
