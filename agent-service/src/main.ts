import { serve } from '@hono/node-server';
import { createLogger } from '@procureguard/shared/log';
import { createArmorIQ } from './agent';
import { createApp } from './app';
import { loadConfig } from './config';
import { createRunRegistry } from './runs';

const config = loadConfig(process.env);
const log = createLogger('agent-service', config.LOG_LEVEL);
const app = createApp({ config, log, armoriq: createArmorIQ(config), registry: createRunRegistry(log) });

serve({ fetch: app.fetch, port: config.AGENT_PORT }, () => {
  log.info('server.started', { port: config.AGENT_PORT, model: config.llmModel, mcpUrl: config.MCP_URL });
});
