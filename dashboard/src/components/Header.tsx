export function Header() {
  return (
    <header className="flex items-center gap-3 border-b border-line bg-panel px-4 py-3.5 sm:px-6">
      <h1 className="text-base font-medium tracking-tight">Procureguard</h1>
      <span className="rounded-full bg-panel-2 px-2.5 py-0.5 text-xs text-ink">Sandbox</span>
      <span className="hidden truncate text-sm text-faint sm:inline">Acting as Shop manager</span>
      <span className="ml-auto flex shrink-0 items-center gap-2 text-sm text-muted">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-allowed" />
        Protected by ArmorIQ
      </span>
    </header>
  );
}
