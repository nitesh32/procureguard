import type { FeedRow, Verdict } from '../feed';

const verdictStyle: Record<Verdict, { label: string; className: string }> = {
  pending: { label: 'checking', className: 'bg-stone-100 text-stone-600' },
  allowed: { label: 'allowed', className: 'bg-emerald-100 text-emerald-800' },
  held: { label: 'held', className: 'bg-amber-100 text-amber-800' },
  approved: { label: 'approved', className: 'bg-sky-100 text-sky-800' },
  rejected: { label: 'rejected', className: 'bg-stone-200 text-stone-700' },
  blocked: { label: 'blocked', className: 'bg-red-600 text-white' },
  ran: { label: 'ran · no ArmorIQ', className: 'bg-stone-200 text-stone-700' },
  failed: { label: 'failed', className: 'bg-stone-200 text-stone-700' },
};

function shortArgs(args: Record<string, unknown>): string {
  return Object.entries(args)
    .map(([key, value]) => `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('  ');
}

export function DecisionFeed({ rows, running }: { rows: FeedRow[]; running: boolean }) {
  return (
    <section className="rounded-lg border border-stone-300 bg-white">
      <h2 className="border-b border-stone-200 px-4 py-2 text-sm font-semibold">Live decision feed</h2>
      <ol className="min-h-72 divide-y divide-stone-100">
        {rows.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-stone-500">
            {running ? 'The agent is thinking…' : 'Run a scenario to see every action the agent tries, and what ArmorIQ decides.'}
          </li>
        )}
        {rows.map((row) => {
          const style = verdictStyle[row.verdict];
          return (
            <li key={row.id} className={`grid grid-cols-[5rem_1fr_auto] gap-3 px-4 py-2.5 ${row.verdict === 'blocked' ? 'bg-red-50' : ''}`}>
              <time className="pt-0.5 font-mono text-xs text-stone-400">{row.at.slice(11, 19)}</time>
              <div className="min-w-0">
                <p className="font-mono text-sm font-medium">{row.tool}</p>
                <p className="truncate font-mono text-xs text-stone-500">{shortArgs(row.args)}</p>
                {row.reason && <p className="mt-1 text-xs text-stone-700">{row.reason}</p>}
              </div>
              <span className={`h-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${style.className}`}>{style.label}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
