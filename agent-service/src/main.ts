import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { createLogger } from '@procureguard/shared/log';
import { Hono } from 'hono';
import { createArmorIQ } from './agent';
import { createApp } from './app';
import { loadConfig } from './config';
import { createRunRegistry } from './runs';

// Built dashboard (pnpm --filter dashboard build), relative to agent-service/.
const dashboardDir = '../dashboard/dist';

const config = loadConfig(process.env);
const log = createLogger('agent-service', config.LOG_LEVEL);
const api = createApp({ config, log, armoriq: createArmorIQ(config), registry: createRunRegistry(log) });

const server = new Hono()
  .route('/', api)
  .use('/*', serveStatic({ root: dashboardDir }))
  .get('/*', serveStatic({ path: `${dashboardDir}/index.html` }));

serve({ fetch: server.fetch, port: config.AGENT_PORT }, () => {
  log.info('server.started', { port: config.AGENT_PORT, model: config.llmModel, mcpUrl: config.MCP_URL });
});
