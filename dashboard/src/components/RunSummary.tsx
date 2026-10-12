import type { RunEvent, RunRequest } from '../api';

type RunSummaryProps = { request: RunRequest | null; events: RunEvent[]; running: boolean; startError: string | null };

export function RunSummary({ request, events, running, startError }: RunSummaryProps) {
  const final = events.find((event) => event.type === 'final');
  const failure = events.find((event) => event.type === 'run_failed');

  if (!request) return null;

  return (
    <section className="rounded-lg border border-stone-300 bg-white p-4 text-sm">
      <p className="text-xs text-stone-500">
        {request.userEmail} · ArmorIQ {request.armoriqEnabled ? 'ON' : 'OFF (comparison only)'} · “{request.prompt}”
      </p>
      {running && <p className="mt-2 text-stone-600">Running…</p>}
      {startError && <p className="mt-2 text-red-700">Could not start the run: {startError}</p>}
      {failure && <p className="mt-2 text-red-700">Run failed: {failure.error}</p>}
      {final && <p className="mt-2 whitespace-pre-wrap leading-relaxed">{final.answer}</p>}
    </section>
  );
}
