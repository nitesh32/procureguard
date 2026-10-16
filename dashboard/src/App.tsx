import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, type DashboardConfig, type Scenario, type ShopState } from './api';
import { BlockedCard } from './components/BlockedCard';
import { Chat } from './components/Chat';
import { Counters } from './components/Counters';
import { GateStatus } from './components/GateStatus';
import { Header } from './components/Header';
import { HeldCard } from './components/HeldCard';
import { VoiceApproval } from './components/VoiceApproval';
import { WorldTabs } from './components/WorldTabs';
import { describeCall, holdReason, summarize, toCalls, type Call } from './feed';
import { useRun, type Turn } from './useRun';

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

  const lastEvent = run.current?.events.at(-1);
  useEffect(() => {
    if (lastEvent && shopChangingEvents.has(lastEvent.type)) void refreshShop().catch(() => setApiDown(true));
  }, [lastEvent, refreshShop]);

  // Totals and world effects cover the whole conversation; the gate shows the newest action.
  const allCalls = useMemo(() => run.turns.flatMap((turn) => toCalls(turn.events)), [run.turns]);
  const currentCalls = useMemo(() => (run.current ? toCalls(run.current.events) : []), [run.current]);
  const latest = currentCalls.at(-1);

  const names = useMemo(
    () => ({
      suppliers: Object.fromEntries((shop?.suppliers ?? []).map((s) => [s.id, s.name])),
      items: Object.fromEntries((shop?.inventory ?? []).map((i) => [i.sku, i.name])),
    }),
    [shop],
  );
  const describe = (call: Call) => describeCall(call, names);

  // ArmorIQ is always on; the demo runs as the configured manager.
  const ask = (prompt: string) => config && run.start({ prompt, userEmail: config.users.manager, armoriqEnabled: true });

  const renderCards = (calls: Call[], turn: Turn) => {
    const blocked = calls.find((call) => call.verdict === 'blocked');
    const held = calls.find((call) => call.wasHeld);
    const why = held && holdReason(held.reason);
    const decision = turn.events.findLast((event) => event.type === 'approval_decided')?.decision;
    return (
      <>
        {blocked && (
          <BlockedCard
            call={blocked}
            sentence={describe(blocked)}
            supplierName={names.suppliers[String(blocked.args.supplierId)]}
            currentAccount={shop?.suppliers.find((s) => s.id === blocked.args.supplierId)?.payee?.accountNumberMasked}
          />
        )}
        {held && why && config && (
          <HeldCard
            call={held}
            itemName={names.items[String(held.args.sku)]}
            why={why}
            waitSeconds={config.approvalWaitSeconds}
            decision={decision}
            consoleUrl={config.armoriqConsoleUrl}
            voice={
              config.elevenLabsAgentId &&
              turn.runId && (
                <VoiceApproval
                  agentId={config.elevenLabsAgentId}
                  runId={turn.runId}
                  requestedBy="the shop manager"
                  amount={Number(held.args.amount)}
                  quoteId={String(held.args.quoteId ?? '')}
                  why={why}
                />
              )
            }
          />
        )}
      </>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <Header />
      {apiDown && (
        <div className="flex items-center gap-3 border-b border-blocked/20 bg-blocked/5 px-6 py-2 text-sm text-blocked">
          The agent service is not reachable. Start it with <code className="font-mono">make up</code>.
          <button type="button" onClick={() => void load()} className="rounded-md border border-blocked/30 px-2 py-0.5">
            Retry
          </button>
        </div>
      )}
      <main className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-[minmax(0,62fr)_minmax(0,38fr)] gap-4 p-4">
        <Chat turns={run.turns} scenarios={scenarios} disabled={run.running || !config} onAsk={ask} describe={describe} renderCards={renderCards} />
        <aside className="flex min-h-0 flex-col gap-3">
          <GateStatus latest={latest} sentence={latest && describe(latest)} />
          <Counters summary={summarize(allCalls)} />
          <WorldTabs shop={shop} calls={allCalls} />
        </aside>
      </main>
    </div>
  );
}
