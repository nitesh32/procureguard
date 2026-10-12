// Real ArmorIQ + real LLM. Costs credits, so it only runs with `make test-live`.
// Needs a full .env, the MCP server reachable at MCP_URL, and the console set up.
import { createLogger } from '@procureguard/shared/log';
import { describe, expect, it } from 'vitest';
import { createArmorIQ, startRun } from '../src/agent';
import { loadConfig } from '../src/config';
import { createRunRegistry, isEndOfRun, type RunEvent } from '../src/runs';
import { scenarios } from '../src/scenarios';

const live = process.env.LIVE === '1';

describe.skipIf(!live)('live scenes (real ArmorIQ)', () => {
  const config = live ? loadConfig(process.env) : ({} as ReturnType<typeof loadConfig>);
  const mcpBase = new URL('/', config.MCP_URL ?? 'http://localhost');
  const shopState = async () => (await fetch(new URL('state', mcpBase))).json();
  const reset = () => fetch(new URL('reset', mcpBase), { method: 'POST', headers: { 'x-reset-secret': config.RESET_SECRET } });

  async function runScene(id: number): Promise<RunEvent[]> {
    const log = createLogger('live-test', 'warn');
    const registry = createRunRegistry(log);
    const scene = scenarios.find((s) => s.id === id)!;
    const runId = startRun({ config, log, registry, armoriq: createArmorIQ(config) }, { ...scene, armoriqEnabled: true });
    await new Promise<void>((done) => registry.subscribe(runId, (event) => isEndOfRun(event) && done()));
    return registry.events(runId);
  }

  it('scene 1: place_order for 20000 is allowed and the order exists', async () => {
    await reset();
    const events = await runScene(1);
    expect(events).toContainEqual(expect.objectContaining({ type: 'allowed', tool: 'place_order' }));
    expect((await shopState()).orders).toContainEqual(expect.objectContaining({ amount: 20000 }));
  }, 180_000);

  it('scene 3: update_payee_bank is blocked, payee unchanged, quote flagged', async () => {
    await reset();
    const events = await runScene(3);
    expect(events).toContainEqual(expect.objectContaining({ type: 'block', tool: 'update_payee_bank' }));
    const state = await shopState();
    expect(state.suppliers.find((s: { id: string }) => s.id === 'SUP-03').payee.accountNumberMasked).toBe('••••0033');
    expect(state.reviewFlags.length).toBeGreaterThan(0);
  }, 180_000);
});
