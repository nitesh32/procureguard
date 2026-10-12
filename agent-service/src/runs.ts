import type { Logger, LogLevel } from '@procureguard/shared/log';

export type RunEvent = { type: string; at: string } & Record<string, unknown>;
type Listener = (event: RunEvent) => void;

// Every run event and the log line it produces. ArmorIQ onEvent kinds
// (hold, approved, rejected, timeout, block, error) arrive here unchanged.
const logLineFor: Record<string, [LogLevel, string]> = {
  run_started: ['info', 'run.started'],
  call: ['info', 'tool.call.requested'],
  allowed: ['info', 'tool.call.allowed'],
  hold: ['warn', 'armoriq.call.held'],
  approved: ['info', 'armoriq.call.approved'],
  rejected: ['warn', 'armoriq.call.rejected'],
  timeout: ['warn', 'armoriq.call.timeout'],
  block: ['warn', 'armoriq.call.blocked'],
  error: ['error', 'armoriq.enforcement.failed'],
  tool_result: ['debug', 'tool.call.completed'],
  tool_error: ['warn', 'tool.call.errored'],
  approval_decided: ['info', 'approval.decided'],
  final: ['info', 'run.completed'],
  run_failed: ['error', 'run.failed'],
};

const endOfRun = new Set(['final', 'run_failed']);

export const isEndOfRun = (event: RunEvent) => endOfRun.has(event.type);

export type RunRegistry = ReturnType<typeof createRunRegistry>;

export function createRunRegistry(log: Logger) {
  const runs = new Map<string, { events: RunEvent[]; listeners: Set<Listener> }>();

  const runFor = (runId: string) => {
    const run = runs.get(runId);
    if (!run) throw new Error(`Unknown run ${runId}`);
    return run;
  };

  return {
    has: (runId: string) => runs.has(runId),

    start: (runId: string) => runs.set(runId, { events: [], listeners: new Set() }),

    /** The one place run events are stored, streamed and logged. */
    record(runId: string, type: string, fields: Record<string, unknown> = {}) {
      const event: RunEvent = { type, at: new Date().toISOString(), ...fields };
      const run = runFor(runId);
      run.events.push(event);
      run.listeners.forEach((listener) => listener(event));
      const [level, logEvent] = logLineFor[type] ?? ['info', `run.event.${type}`];
      log[level](logEvent, { runId, ...fields });
    },

    events: (runId: string) => [...runFor(runId).events],

    subscribe(runId: string, listener: Listener) {
      const { listeners } = runFor(runId);
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
