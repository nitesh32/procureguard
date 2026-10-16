import { ShieldCheck } from 'lucide-react';

export function Header() {
  return (
    <header className="flex items-center gap-4 border-b border-line bg-panel px-6 py-3">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <h1 className="text-lg leading-tight font-semibold tracking-tight">Procureguard</h1>
        <p className="truncate text-sm text-muted">An autonomous purchasing agent. Every action is checked by ArmorIQ before it runs.</p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden font-mono text-xs text-muted lg:inline">procurement-agent</span>
        <span className="flex items-center gap-2 rounded-full border border-allowed/30 bg-allowed/5 px-3 py-1.5 text-sm font-medium text-allowed">
          <span aria-hidden className="h-2 w-2 animate-pulse-dot rounded-full bg-allowed" />
          Protected by ArmorIQ
        </span>
        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-muted">SANDBOX</span>
      </div>
    </header>
  );
}
