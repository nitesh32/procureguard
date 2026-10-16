import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type DashboardConfig, type Scenario, type ShopState } from './api';
import { AgentFlow } from './components/AgentFlow';
import { AnswerPanel } from './components/AnswerPanel';
import { Counters } from './components/Counters';
import { Header } from './components/Header';
import { HeldCard } from './components/HeldCard';
import { PromptBar } from './components/PromptBar';
import { Timeline } from './components/Timeline';
import { VoiceApproval } from './components/VoiceApproval';
import { WorldPanel } from './components/WorldPanel';
import { describeCall, summarize, toCalls, type Call } from './feed';
import { useRun } from './useRun';

// Events after which the shop data may have changed.
const shopChangingEvents = new Set(['tool_result', 'final']);

export function App() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [shop, setShop] = useState<ShopState | null>(null);
  const [apiDown, setApiDown] = useState(false);
  const run = useRun();

  const refreshShop = useCallback(() => api.shopState().then(setShop), []);
  const { clear } = run;
  const resetDemo = useCallback(() => {
    clear();
    return api.resetShop().then(setShop).catch(() => setApiDown(true));
  }, [clear]);

  const load = useCallback(async () => {
    try {
      const [loadedConfig, loadedScenarios] = await Promise.all([api.config(), api.scenarios(), refreshShop()]);
      setConfig(loadedConfig);
      setScenarios(loadedScenarios);
      setApiDown(false);
    } catch {
      setApiDown(true);
    }
  }, [refreshShop]);

  useEffect(() => void load(), [load]);

  // Hidden reset for the presenter: Shift+R, or open the page with ?reset.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('reset')) {
      void resetDemo();
      window.history.replaceState(null, '', window.location.pathname);
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key === 'R' && !(event.target instanceof HTMLInputElement)) void resetDemo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [resetDemo]);

  const lastEvent = run.events.at(-1);
  useEffect(() => {
    if (lastEvent && shopChangingEvents.has(lastEvent.type)) void refreshShop().catch(() => setApiDown(true));
  }, [lastEvent, refreshShop]);

  const calls = useMemo(() => toCalls(run.events), [run.events]);
  const summary = summarize(calls);
  const names = useMemo(
    () => ({
      suppliers: Object.fromEntries((shop?.suppliers ?? []).map((s) => [s.id, s.name])),
      items: Object.fromEntries((shop?.inventory ?? []).map((i) => [i.sku, i.name])),
    }),
    [shop],
  );
  const describe = (call: Call) => describeCall(call, names);

  // ArmorIQ is always on; the demo runs as the configured manager.
  const runPrompt = (prompt: string) => config && run.start({ prompt, userEmail: config.users.manager, armoriqEnabled: true });

  const blocked = calls.find((call) => call.verdict === 'blocked');
  const held = calls.find((call) => call.verdict === 'held');

  return (
    <div className="grid h-full grid-rows-[auto_auto_minmax(0,1fr)_auto]">
      <Header />
      <div>
        {apiDown && (
          <div className="mx-6 flex items-center gap-3 rounded-lg bg-blocked/15 px-4 py-2 text-sm text-blocked">
            The agent service is not reachable. Start it with <code className="font-mono">make up</code>.
            <button type="button" onClick={() => void load()} className="rounded bg-blocked/20 px-2 py-0.5">
              Retry
            </button>
          </div>
        )}
        <PromptBar scenarios={scenarios} disabled={run.running || !config} onRun={runPrompt} />
      </div>

      <main className="grid min-h-0 grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 px-6 pb-4">
        <div className="grid min-h-0 grid-rows-[15rem_minmax(0,1fr)_11rem] gap-3">
          <AgentFlow
            calls={calls}
            idle={!run.request}
            attackBanner={blocked && `Attack stopped: the agent ${lowerFirst(describe(blocked))}. ArmorIQ blocked it before it ran.`}
            heldCard={
              held &&
              config && (
                <HeldCard
                  call={held}
                  itemName={names.items[String(held.args.sku)]}
                  consoleUrl={config.armoriqConsoleUrl}
                  voice={
                    config.elevenLabsAgentId &&
                    run.runId && (
                      <VoiceApproval
                        agentId={config.elevenLabsAgentId}
                        runId={run.runId}
                        requestedBy="the shop manager"
                        amount={Number(held.args.amount)}
                        quoteId={String(held.args.quoteId ?? '')}
                        reason={held.reason}
                      />
                    )
                  }
                />
              )
            }
          />
          <Timeline calls={calls} describe={describe} />
          <AnswerPanel events={run.events} running={run.running} startError={run.startError} summary={summary} />
        </div>
        <WorldPanel shop={shop} calls={calls} />
      </main>

      <Counters summary={summary} />
    </div>
  );
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
