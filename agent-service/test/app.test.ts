import { createLogger } from '@procureguard/shared/log';
import { describe, expect, it } from 'vitest';
import type { AgentDeps } from '../src/agent';
import { createApp } from '../src/app';
import type { Config } from '../src/config';
import { createRunRegistry } from '../src/runs';

function setup() {
  const log = createLogger('test', 'error');
  const registry = createRunRegistry(log);
  const deps = { config: { MCP_URL: 'https://example.test/mcp' } as Config, log, registry, armoriq: {} } as AgentDeps;
  return { registry, app: createApp(deps) };
}

const postJson = (body: unknown) => ({ method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

describe('agent API', () => {
  it('lists the 3 demo scenarios', async () => {
    const scenarios = await (await setup().app.request('/scenarios')).json();
    expect(scenarios.map((s: { expect: string }) => s.expect)).toEqual(['allowed', 'held', 'blocked']);
  });

  it('rejects a run without a valid user email', async () => {
    expect((await setup().app.request('/runs', postJson({ prompt: 'hi', userEmail: 'nope' }))).status).toBe(400);
  });

  it('records the voice decision and points to the console for the real approval', async () => {
    const { app, registry } = setup();
    registry.start('r1');
    const response = await app.request('/approvals/r1', postJson({ decision: 'approve' }));
    expect(await response.json()).toMatchObject({ recorded: true, consoleUrl: 'https://platform.armoriq.ai' });
    expect(registry.events('r1')).toMatchObject([{ type: 'approval_decided', decision: 'approve' }]);
  });

  it('streams a finished run as server-sent events', async () => {
    const { app, registry } = setup();
    registry.start('r1');
    registry.record('r1', 'call', { tool: 'place_order' });
    registry.record('r1', 'final', { answer: 'done' });
    const body = await (await app.request('/runs/r1/events')).text();
    expect(body).toContain('"type":"call"');
    expect(body).toContain('"type":"final"');
  });

  it('returns 404 for unknown runs', async () => {
    expect((await setup().app.request('/runs/missing/events')).status).toBe(404);
  });
});
