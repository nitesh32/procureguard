import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Logger } from '@procureguard/shared/log';
import type { Store } from './store';
import { allTools } from './tools';
import { ToolInputError, type Tool } from './tools/tool';

export function createMcpServer({ store, log }: { store: Store; log: Logger }): McpServer {
  const server = new McpServer({ name: 'procurement-mcp', version: '0.1.0' });
  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      (args: Record<string, unknown>) => runLoggedTool(tool, args, store, log),
    );
  }
  return server;
}

/** The one place tool calls are logged. Tools themselves never log. */
async function runLoggedTool(tool: Tool<any>, args: Record<string, unknown>, store: Store, log: Logger) {
  const toolLog = log.child({ tool: tool.name });
  const startedAt = performance.now();
  toolLog.info('tool.call.started', { args });
  try {
    const result = await tool.run(args, store);
    const resultId = (result as { id?: unknown } | undefined)?.id;
    toolLog.info('tool.call.succeeded', { resultId, durationMs: Math.round(performance.now() - startedAt) });
    return { content: [{ type: 'text' as const, text: JSON.stringify(result) }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (error instanceof ToolInputError) toolLog.warn('tool.call.rejected', { reason: message });
    else toolLog.error('tool.call.failed', { error: message });
    return { content: [{ type: 'text' as const, text: message }], isError: true };
  }
}
