import { useState } from 'react';
import type { Scenario } from '../api';

type ScenarioBarProps = { scenarios: Scenario[]; disabled: boolean; onRun: (prompt: string) => void };

export function ScenarioBar({ scenarios, disabled, onRun }: ScenarioBarProps) {
  const [prompt, setPrompt] = useState('');

  return (
    <section className="flex flex-wrap items-center gap-2">
      {scenarios.map((scenario) => (
        <button
          key={scenario.id}
          type="button"
          disabled={disabled}
          onClick={() => onRun(scenario.prompt)}
          title={scenario.prompt}
          className="rounded-md border border-stone-300 bg-white px-3 py-2 text-sm hover:border-stone-500 disabled:opacity-50"
        >
          <span className="mr-2 font-mono text-xs text-stone-400">{scenario.id}</span>
          {scenario.title}
        </button>
      ))}

      <form
        className="flex min-w-64 flex-1 gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (prompt.trim()) onRun(prompt.trim());
        }}
      >
        <input
          id="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Or ask the purchasing agent anything…"
          className="flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
          disabled={disabled}
        />
        <button type="submit" disabled={disabled || !prompt.trim()} className="rounded-md bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-40">
          Run
        </button>
      </form>
    </section>
  );
}
