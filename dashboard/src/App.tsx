import { useCallback, useEffect, useState } from 'react';
import { api, type DashboardConfig, type Scenario, type ShopState } from './api';
import { ApprovalCard } from './components/ApprovalCard';
import { DecisionFeed } from './components/DecisionFeed';
import { RunSummary } from './components/RunSummary';
import { ScenarioBar } from './components/ScenarioBar';
import { ShopPanels } from './components/ShopPanels';
import { TopBar } from './components/TopBar';
import { VoiceApproval } from './components/VoiceApproval';
import { isEndOfRun, pendingApproval, toFeedRows } from './feed';
import { useRun } from './useRun';

// Events after which the shop data may have changed.
const shopChangingEvents = new Set(['tool_result', 'final']);

export function App() {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [shop, setShop] = useState<ShopState | null>(null);
  const [apiDown, setApiDown] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [armoriqEnabled, setArmoriqEnabled] = useState(true);
  const run = useRun();

  const refreshShop = useCallback(() => api.shopState().then(setShop), []);

  const load = useCallback(async () => {
    try {
      const [loadedConfig, loadedScenarios] = await Promise.all([api.config(), api.scenarios(), refreshShop()]);
      setConfig(loadedConfig);
      setScenarios(loadedScenarios);
      setUserEmail((current) => current || Object.values(loadedConfig.users)[0]);
      setApiDown(false);
    } catch {
      setApiDown(true);
    }
  }, [refreshShop]);

  useEffect(() => void load(), [load]);

  const lastEvent = run.events.at(-1);
  useEffect(() => {
    if (lastEvent && shopChangingEvents.has(lastEvent.type)) void refreshShop().catch(() => setApiDown(true));
  }, [lastEvent, refreshShop]);

  const resetShop = () => api.resetShop().then(setShop).catch(() => setApiDown(true));
  const runPrompt = (prompt: string) => run.start({ prompt, userEmail, armoriqEnabled });

  const approval = pendingApproval(run.events);
  const offRunFinished = run.request?.armoriqEnabled === false && run.events.some(isEndOfRun);

  return (
    <div className="min-h-screen">
      <TopBar
        users={config?.users ?? {}}
        userEmail={userEmail}
        onUserChange={setUserEmail}
        armoriqEnabled={armoriqEnabled}
        onArmoriqChange={setArmoriqEnabled}
        onReset={resetShop}
        disabled={run.running || !config}
      />

      {apiDown && (
        <div className="flex items-center gap-3 bg-red-700 px-6 py-2 text-sm text-white">
          The agent service is not reachable. Start it with <code className="font-mono">make dev</code>.
          <button type="button" onClick={() => void load()} className="rounded bg-white/20 px-2 py-0.5">
            Retry
          </button>
        </div>
      )}
      {offRunFinished && (
        <div className="flex items-center gap-3 bg-red-100 px-6 py-2 text-sm text-red-900">
          That run had ArmorIQ OFF, so the shop data may have been changed by it.
          <button type="button" onClick={resetShop} className="rounded bg-red-700 px-2 py-0.5 text-white">
            Reset demo
          </button>
        </div>
      )}

      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5">
        <ScenarioBar scenarios={scenarios} disabled={run.running || !config} onRun={runPrompt} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            {approval && config && (
              <ApprovalCard
                approval={approval}
                consoleUrl={config.armoriqConsoleUrl}
                voice={
                  config.elevenLabsAgentId &&
                  run.runId && (
                    <VoiceApproval
                      agentId={config.elevenLabsAgentId}
                      runId={run.runId}
                      requestedBy={run.request?.userEmail ?? 'the manager'}
                      amount={Number(approval.args.amount)}
                      quoteId={String(approval.args.quoteId ?? '')}
                      reason={approval.reason}
                    />
                  )
                }
              />
            )}
            <DecisionFeed rows={toFeedRows(run.events)} running={run.running} />
            <RunSummary request={run.request} events={run.events} running={run.running} startError={run.startError} />
          </div>
          <ShopPanels state={shop} />
        </div>
      </main>
    </div>
  );
}
