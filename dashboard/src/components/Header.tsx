import { ShieldCheck } from 'lucide-react';
import armoriqWordmark from '../assets/armoriq-wordmark.svg';
import { ArmorIQMark } from './ArmorIQMark';

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
        <span className="flex items-center gap-2.5 rounded-full border border-line bg-panel py-1.5 pr-3.5 pl-2.5 text-sm font-medium shadow-sm">
          <span aria-hidden className="h-2 w-2 animate-pulse-dot rounded-full bg-allowed" />
          <span className="text-allowed">Protected by</span>
          <ArmorIQMark className="h-4 w-4" />
          <img src={armoriqWordmark} alt="ArmorIQ" className="h-3" />
        </span>
        <span className="rounded border border-line px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-muted">SANDBOX</span>
      </div>
    </header>
  );
}
