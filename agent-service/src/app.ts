import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { startRun, type AgentDeps } from './agent';
import { isEndOfRun, type RunEvent } from './runs';
import { scenarios } from './scenarios';

const armoriqConsoleUrl = 'https://platform.armoriq.ai';

const runRequestSchema = z.object({
  prompt: z.string().min(1),
  userEmail: z.string().email(),
  armoriqEnabled: z.boolean().default(true),
});
const approvalSchema = z.object({ decision: z.enum(['approve', 'reject']) });

export function createApp(deps: AgentDeps) {
  const { config, registry } = deps;
  const mcpBaseUrl = new URL('/', config.MCP_URL);
  const app = new Hono().basePath('/api');

  app.get('/health', (c) => c.json({ ok: true }));

  app.get('/scenarios', (c) => c.json(scenarios));

  // Runtime settings for the dashboard, so changing them never needs a rebuild.
  app.get('/config', (c) => c.json({ armoriqConsoleUrl, users: config.users, elevenLabsAgentId: config.ELEVENLABS_AGENT_ID ?? null }));

  app.post('/runs', async (c) => {
    const request = runRequestSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!request.success) return c.json({ error: request.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ') }, 400);
    return c.json({ runId: startRun(deps, request.data) }, 202);
  });

  app.get('/runs/:runId/events', (c) => {
    const runId = c.req.param('runId');
    if (!registry.has(runId)) return c.json({ error: `Unknown run ${runId}` }, 404);

    return streamSSE(c, async (stream) => {
      const send = (event: RunEvent) => stream.writeSSE({ data: JSON.stringify(event) });
      const backlog = registry.events(runId);
      for (const event of backlog) await send(event);
      if (backlog.some(isEndOfRun)) return;

      await new Promise<void>((done) => {
        const unsubscribe = registry.subscribe(runId, (event) => {
          // Close only after the last event is written, or it is lost.
          void send(event).then(() => {
            if (!isEndOfRun(event)) return;
            unsubscribe();
            done();
          });
        });
        stream.onAbort(() => {
          unsubscribe();
          done();
        });
      });
    });
  });

  // The owner's voice decision is recorded only. ArmorIQ has no approve API:
  // the approval itself happens in the ArmorIQ console (docs/DECISIONS.md).
  app.post('/approvals/:runId', async (c) => {
    const runId = c.req.param('runId');
    if (!registry.has(runId)) return c.json({ error: `Unknown run ${runId}` }, 404);
    const body = approvalSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!body.success) return c.json({ error: 'decision must be "approve" or "reject"' }, 400);
    registry.record(runId, 'approval_decided', { decision: body.data.decision, by: 'owner (voice)' });
    return c.json({ recorded: true, consoleUrl: armoriqConsoleUrl });
  });

  // Dashboard panels read and reset the sandbox shop through the MCP server's plain HTTP routes.
  app.get('/state', async (c) => c.json(await (await fetch(new URL('state', mcpBaseUrl))).json()));

  app.post('/reset', async (c) => {
    const response = await fetch(new URL('reset', mcpBaseUrl), {
      method: 'POST',
      headers: { 'x-reset-secret': config.RESET_SECRET },
    });
    return c.json(await response.json(), response.ok ? 200 : 502);
  });

  return app;
}
