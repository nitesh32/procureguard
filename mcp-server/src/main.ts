import { readFileSync } from 'node:fs';
import { serve } from '@hono/node-server';
import { createLogger } from '@procureguard/shared/log';
import { z } from 'zod';
import { createApp } from './app';
import { createStore, recordCounts, type Shop } from './store';
import { allTools } from './tools';

const config = z
  .object({
    MCP_PORT: z.coerce.number().int().default(8788),
    RESET_SECRET: z.string().min(1),
    SEED_PATH: z.string().default(new URL('../../seed/shop.json', import.meta.url).pathname),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  })
  .parse(process.env);

const log = createLogger('mcp-server', config.LOG_LEVEL);
const store = createStore(JSON.parse(readFileSync(config.SEED_PATH, 'utf8')) as Shop);
log.info('store.seeded', recordCounts(store.data));

const app = createApp({ store, log, resetSecret: config.RESET_SECRET });
serve({ fetch: app.fetch, port: config.MCP_PORT }, () => {
  log.info('server.started', { port: config.MCP_PORT, toolCount: allTools.length });
});
