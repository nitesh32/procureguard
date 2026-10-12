import type { RunEvent } from './api';

// Turns the raw run events into one row per tool call. Verdicts come only from
// ArmorIQ events (or, with ArmorIQ off, from the tool simply running).

export type Verdict = 'pending' | 'allowed' | 'held' | 'approved' | 'rejected' | 'blocked' | 'ran' | 'failed';

export type FeedRow = {
  id: number;
  tool: string;
  args: Record<string, unknown>;
  verdict: Verdict;
  reason?: string;
  result?: string;
  at: string;
};

const verdictForEvent: Record<string, Verdict> = {
  allowed: 'allowed',
  hold: 'held',
  approved: 'approved',
  rejected: 'rejected',
  timeout: 'rejected',
  block: 'blocked',
  error: 'blocked',
};

export const isEndOfRun = (event: RunEvent) => event.type === 'final' || event.type === 'run_failed';

export function toFeedRows(events: RunEvent[]): FeedRow[] {
  const rows: FeedRow[] = [];
  const latestRowFor = (tool: unknown) => [...rows].reverse().find((row) => row.tool === tool);

  for (const event of events) {
    if (event.type === 'call') {
      rows.push({ id: rows.length, tool: event.tool, args: event.args ?? {}, verdict: 'pending', at: event.at });
      continue;
    }
    const row = latestRowFor(event.tool);
    if (!row) continue;

    const verdict = verdictForEvent[event.type];
    if (verdict) {
      // An approved hold stays "approved" when the tool then runs.
      if (!(row.verdict === 'approved' && verdict === 'allowed')) row.verdict = verdict;
      row.reason = event.reason ?? row.reason;
    } else if (event.type === 'tool_result') {
      row.result = event.result;
      if (row.verdict === 'pending') row.verdict = 'ran';
    } else if (event.type === 'tool_error') {
      row.reason ??= event.error;
      if (row.verdict === 'pending') row.verdict = 'failed';
    }
  }
  return rows;
}

/** The held call waiting for the owner, if any. */
export function pendingApproval(events: RunEvent[]) {
  const held = toFeedRows(events).findLast((row) => row.verdict === 'held');
  if (!held) return undefined;
  const decision = events.findLast((event) => event.type === 'approval_decided')?.decision as string | undefined;
  return { ...held, ownerDecision: decision };
}
