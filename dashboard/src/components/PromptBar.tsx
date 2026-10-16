import { useState } from 'react';
import type { Scenario } from '../api';

type PromptBarProps = { scenarios: Scenario[]; disabled: boolean; onRun: (prompt: string) => void };

export function PromptBar({ scenarios, disabled, onRun }: PromptBarProps) {
  const [prompt, setPrompt] = useState('');

  return (
    <section className="flex items-center gap-3 px-6 py-3">
      {scenarios.map((scenario) => {
        // The scene expected to be blocked is the one with an attack in its quote document.
        const adversarial = scenario.expect === 'blocked';
        return (
          <button
            key={scenario.id}
            type="button"
            disabled={disabled}
            onClick={() => onRun(scenario.prompt)}
            title={scenario.prompt}
            className={`shrink-0 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-40 ${
              adversarial ? 'border-blocked/60 hover:bg-blocked/10' : 'border-line hover:border-muted hover:bg-panel-2'
            }`}
          >
            {scenario.id} · {scenario.title}
            {adversarial && <span className="ml-1.5 text-blocked">⚠</span>}
          </button>
        );
      })}
      <form
        className="flex min-w-0 flex-1 gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (prompt.trim()) onRun(prompt.trim());
        }}
      >
        <label htmlFor="prompt" className="sr-only">Ask the purchasing agent</label>
        <input
          id="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Or ask the purchasing agent anything…"
          disabled={disabled}
          className="min-w-0 flex-1 rounded-lg border border-line bg-panel px-3 py-2.5 text-sm placeholder:text-muted focus:border-muted focus:outline-none"
        />
        <button type="submit" disabled={disabled || !prompt.trim()} className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-ground disabled:opacity-30">
          Run
        </button>
      </form>
    </section>
  );
}
