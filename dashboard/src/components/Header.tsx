export function Header() {
  return (
    <header className="flex items-center gap-6 border-b border-line px-6 py-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">Procureguard</h1>
        <p className="truncate text-sm text-muted">An autonomous purchasing agent. Every action is checked by ArmorIQ before it runs.</p>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span className="font-mono text-xs text-muted">agent: procurement-agent</span>
        <span className="flex items-center gap-2 rounded-full border border-allowed/30 bg-allowed/10 px-3 py-1.5 text-sm font-medium text-allowed">
          <span aria-hidden className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-allowed" />
          Protected by ArmorIQ
        </span>
        <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] tracking-wider text-muted">SANDBOX</span>
      </div>
    </header>
  );
}
