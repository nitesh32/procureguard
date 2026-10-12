import { randomUUID } from 'node:crypto';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import type { Logger } from '@procureguard/shared/log';
import { Hono } from 'hono';
import { createMcpServer } from './mcp';
import { recordCounts, shopState, type Store } from './store';

type AppDeps = { store: Store; log: Logger; resetSecret: string };

export function createApp({ store, log, resetSecret }: AppDeps) {
  const app = new Hono<{ Variables: { log: Logger } }>();

  app.use(async (c, next) => {
    const requestLog = log.child({ requestId: c.req.header('x-request-id') ?? randomUUID().slice(0, 8) });
    c.set('log', requestLog);
    const startedAt = performance.now();
    await next();
    requestLog.info('http.request.completed', {
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      durationMs: Math.round(performance.now() - startedAt),
    });
  });

  app.get('/health', (c) => c.json({ ok: true }));

  app.get('/state', (c) => c.json(shopState(store.data)));

  app.post('/reset', (c) => {
    if (c.req.header('x-reset-secret') !== resetSecret) {
      c.var.log.warn('reset.denied');
      return c.json({ error: 'Missing or wrong x-reset-secret header' }, 401);
    }
    store.reset();
    c.var.log.info('store.reset', recordCounts(store.data));
    return c.json(shopState(store.data));
  });

  // Stateless MCP: a fresh server and transport per request; the store holds the state.
  app.all('/mcp', async (c) => {
    const server = createMcpServer({ store, log: c.var.log });
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await server.connect(transport);
    return transport.handleRequest(c.req.raw);
  });

  return app;
}
