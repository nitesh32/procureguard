import armoriqWordmark from '../assets/armoriq-wordmark.svg';

export function Header() {
  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <h1 className="text-base font-semibold tracking-tight">Procureguard</h1>
        <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-wider text-ink uppercase">Sandbox</span>
        <p className="hidden truncate text-sm text-muted xl:block">An AI purchasing agent. ArmorIQ checks every action before it runs.</p>
      </div>
      <div className="ml-auto flex items-center gap-4 text-sm">
        <span className="hidden text-muted sm:inline">
          Acting as <span className="font-medium text-ink">Shop manager</span>
        </span>
        <span className="flex items-center gap-2 text-muted">
          Protected by
          <img src={armoriqWordmark} alt="ArmorIQ" className="h-3.5" />
        </span>
      </div>
    </header>
  );
}
