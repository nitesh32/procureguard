import { Bot, ChevronRight, Wrench } from 'lucide-react';
import type { ComponentType } from 'react';
import { ArmorIQMark } from './ArmorIQMark';
import type { Call } from '../feed';
import { verdictLook } from './VerdictPill';

// Live status of the newest action: Agent → ArmorIQ → Tool, with ArmorIQ's verdict.
export function GateStatus({ latest, sentence }: { latest?: Call; sentence?: string }) {
  const look = latest ? verdictLook[latest.verdict] : undefined;
  const toolRan = latest?.verdict === 'allowed' || latest?.verdict === 'approved';
  const stopped = latest?.verdict === 'blocked' || latest?.verdict === 'rejected';

  return (
    <section aria-label="ArmorIQ gate" aria-live="polite" className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <h2 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted uppercase">
        <ArmorIQMark className="h-3.5 w-3.5" /> Live · ArmorIQ gate
      </h2>
      <div className="mt-3 flex items-center justify-between gap-1">
        <Stage Icon={Bot} label="Agent" active={!!latest} />
        <ChevronRight className="h-4 w-4 text-line" aria-hidden />
        <Stage
          Icon={look?.Icon ?? ArmorIQIcon}
          label={look?.label ?? 'ArmorIQ'}
          active={!!latest}
          tone={look?.text}
          spin={look?.spin}
          emphasise
        />
        <ChevronRight className="h-4 w-4 text-line" aria-hidden />
        <Stage Icon={Wrench} label={stopped ? 'not run' : 'Tool'} active={toolRan} tone={stopped ? 'text-blocked' : toolRan ? 'text-allowed' : undefined} />
      </div>
      <p className="mt-3 truncate text-sm text-muted">
        {latest ? (
          <>
            <code className="font-mono text-xs text-ink">{latest.tool}</code> · {sentence}
          </>
        ) : (
          'Waiting for the agent’s first action'
        )}
      </p>
    </section>
  );
}

const ArmorIQIcon = ({ className }: { className?: string }) => <ArmorIQMark className={className} />;

type StageProps = { Icon: ComponentType<{ className?: string }>; label: string; active: boolean; tone?: string; spin?: boolean; emphasise?: boolean };

function Stage({ Icon, label, active, tone, spin, emphasise }: StageProps) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
      <span
        className={`grid place-items-center rounded-xl border transition-colors ${emphasise ? 'h-11 w-11' : 'h-9 w-9'} ${
          active ? `border-current bg-panel ${tone ?? 'text-ink'}` : 'border-line bg-panel-2 text-muted'
        }`}
      >
        <Icon className={`h-5 w-5 ${spin ? 'animate-spin' : ''}`} aria-hidden />
      </span>
      <span className={`truncate text-xs font-medium ${active ? (tone ?? 'text-ink') : 'text-muted'}`}>{label}</span>
    </div>
  );
}
