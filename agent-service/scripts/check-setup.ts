// Usage: make check. Read-only: prints OK / FAIL / INFO for each setup step.
import { ArmorIQClient } from '@armoriq/sdk';
import { loadConfig } from '../src/config';

const expectedToolCount = 10;
let failed = false;

const report = (status: 'OK' | 'FAIL' | 'INFO', check: string, detail = '') => {
  if (status === 'FAIL') failed = true;
  console.log(`${status.padEnd(4)}  ${check}${detail ? `: ${detail}` : ''}`);
};

const config = loadConfig(process.env);
report('OK', 'config', '.env has every required variable');

try {
  const response = await fetch(config.MCP_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
  const toolCount = ((await response.json()) as { result?: { tools?: unknown[] } }).result?.tools?.length ?? 0;
  report(toolCount === expectedToolCount ? 'OK' : 'FAIL', 'MCP reachable', `${toolCount} tools at ${config.MCP_URL}`);
} catch (error) {
  report('FAIL', 'MCP reachable', `${config.MCP_URL}: ${(error as Error).message}`);
}

try {
  const bootstrap = await new ArmorIQClient({ apiKey: config.ARMORIQ_API_KEY, agentId: config.ARMORIQ_AGENT_NAME }).bootstrap();
  report('OK', 'ArmorIQ API key', 'bootstrap succeeded');

  const toolMap = (bootstrap.toolMap ?? {}) as Record<string, string>;
  const registeredTools = Object.values(toolMap).filter((mcp) => mcp === config.ARMORIQ_MCP_NAME).length;
  report(
    registeredTools === expectedToolCount ? 'OK' : 'FAIL',
    `MCP "${config.ARMORIQ_MCP_NAME}" registered`,
    `${registeredTools}/${expectedToolCount} tools known to ArmorIQ`,
  );

  const agentKnown = JSON.stringify(bootstrap).includes(config.ARMORIQ_AGENT_NAME);
  report(agentKnown ? 'OK' : 'INFO', `agent "${config.ARMORIQ_AGENT_NAME}"`, agentKnown ? 'found in bootstrap' : 'not visible in bootstrap; confirm in the console');
} catch (error) {
  report('FAIL', 'ArmorIQ API key', (error as Error).message);
}

report('INFO', 'policies', 'the SDK cannot list policies; confirm the 4 policies in the console (docs/ARMORIQ_SETUP.md)');
process.exit(failed ? 1 : 0);
