import { Ban, Check, CirclePause, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { rupees, type summarize } from '../feed';

type CountersProps = { summary: ReturnType<typeof summarize> };

export function Counters({ summary }: CountersProps) {
  return (
    <section aria-label="Totals" className="grid grid-cols-2 gap-2.5">
      <Tile label="Allowed" Icon={Check} value={summary.allowed} tone="text-allowed" />
      <Tile label="Held for approval" Icon={CirclePause} value={summary.held} tone="text-held" />
      <Tile label="Blocked" Icon={Ban} value={summary.blocked} tone="text-blocked" />
      <Tile label="Money protected" Icon={ShieldCheck} value={summary.protectedAmount} tone="text-brand" format={rupees} />
    </section>
  );
}

type TileProps = { label: string; Icon: LucideIcon; value: number; tone: string; format?: (n: number) => string };

function Tile({ label, Icon, value, tone, format = String }: TileProps) {
  const shown = useCountUp(value);
  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-3 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
        <Icon className={`h-3.5 w-3.5 ${tone}`} aria-hidden />
        {label}
      </p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone}`}>{format(shown)}</p>
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
