import type { RunEvent } from './api';

// Turns raw run events into one row per tool call. Verdicts come only from
// ArmorIQ events (the "allowed" event is emitted when a tool ran under ArmorIQ).

// 'error' = ArmorIQ's check itself failed (e.g. unreachable). It fails closed, but it is not a policy block.
export type Verdict = 'checking' | 'allowed' | 'held' | 'approved' | 'rejected' | 'blocked' | 'error' | 'failed' | 'no-verdict';

export type Call = {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  verdict: Verdict;
  wasHeld: boolean;
  reason?: string;
  result?: string;
  startedAt: number;
  decidedAt?: number;
  /** When ArmorIQ held it; stays set after the owner's decision. */
  heldAt?: number;
};

const armoriqVerdicts: Record<string, Verdict> = {
  hold: 'held',
  block: 'blocked',
  error: 'error',
  approved: 'approved',
  rejected: 'rejected',
  timeout: 'rejected',
};

export const isEndOfRun = (event: RunEvent) => event.type === 'final' || event.type === 'run_failed';

export function toCalls(events: RunEvent[]): Call[] {
  const calls: Call[] = [];
  const byId = (id: unknown) => calls.find((call) => call.id === id);
  // ArmorIQ events carry no call id: match the oldest call of that tool still waiting on them.
  const oldestWaiting = (tool: unknown, verdict: Verdict) => calls.find((call) => call.tool === tool && call.verdict === verdict);

  for (const event of events) {
    const at = Date.parse(event.at);
    if (event.type === 'call') {
      calls.push({ id: String(event.callId ?? calls.length), tool: event.tool, args: event.args ?? {}, verdict: 'checking', wasHeld: false, startedAt: at });
      continue;
    }

    const armoriqVerdict = armoriqVerdicts[event.type];
    if (armoriqVerdict) {
      const waitingOn: Verdict = armoriqVerdict === 'held' || armoriqVerdict === 'blocked' || armoriqVerdict === 'error' ? 'checking' : 'held';
      const call = oldestWaiting(event.tool, waitingOn);
      if (!call) continue;
      call.verdict = armoriqVerdict;
      call.wasHeld ||= armoriqVerdict === 'held';
      if (armoriqVerdict === 'held') call.heldAt = at;
      call.reason = event.reason ?? event.error ?? call.reason;
      call.decidedAt = at;
      continue;
    }

    const call = byId(event.callId) ?? oldestWaiting(event.tool, 'checking');
    if (!call) continue;
    if (event.type === 'allowed' && call.verdict === 'checking') {
      call.verdict = 'allowed';
      call.decidedAt = at;
    } else if (event.type === 'tool_result') {
      call.result = event.result;
    } else if (event.type === 'tool_error' && call.verdict === 'checking') {
      call.verdict = 'failed';
      call.reason = event.error;
      call.decidedAt = at;
    }
  }

  // Once the run is over, nothing is still being checked.
  if (events.some(isEndOfRun)) {
    for (const call of calls) if (call.verdict === 'checking') call.verdict = 'no-verdict';
  }
  return calls;
}

export function summarize(calls: Call[]) {
  const count = (...verdicts: Verdict[]) => calls.filter((call) => verdicts.includes(call.verdict)).length;
  return {
    total: calls.length,
    allowed: count('allowed', 'approved'),
    held: calls.filter((call) => call.wasHeld).length,
    blocked: count('blocked'),
  };
}

/** Plain-language reason for a hold, for the approval card and the voice call. */
export const holdReason = (reason?: string) => (!reason || reason === 'rule_action_hold' ? 'every purchase order needs owner approval' : reason);

export const rupees = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

/** HH:MM:SS, for step times, the decision log and card footnotes. */
export const clock = (at: number) => new Date(at).toLocaleTimeString('en-GB');

type Names = { suppliers: Record<string, string>; items: Record<string, string> };

const possessive = (name: string) => (name.endsWith('s') ? `${name}'` : `${name}'s`);

// Plain-language sentence for a call, for the timeline and the attack banner.
const describers: Record<string, (args: Record<string, any>, names: Names) => string> = {
  check_inventory: (a) => (a.sku ? `Checked stock for ${a.sku}` : 'Checked stock levels'),
  list_suppliers: () => 'Listed suppliers and their payee accounts',
  get_quote: (a, n) => (a.quoteId ? `Looked up quote ${a.quoteId}` : `Looked up quotes for ${n.items[a.sku] ?? a.sku ?? 'all items'}`),
  read_quote_document: (a) => `Read the supplier's quote document ${a.quoteId ?? ''}`.trim(),
  add_note: (a) => `Added a note to ${a.entityId ?? 'a record'}`,
  flag_for_review: (a) => `Flagged ${a.entityId ?? 'a record'} for human review`,
  place_order: (a, n) => `Tried to place an order: ${rupees(Number(a.amount) || 0)} · ${n.items[a.sku] ?? a.sku} ×${a.qty}`,
  update_payee_bank: (a, n) => `Tried to change ${possessive(n.suppliers[a.supplierId] ?? a.supplierId)} payee bank account`,
  delete_supplier: (a, n) => `Tried to delete supplier ${n.suppliers[a.supplierId] ?? a.supplierId}`,
  export_supplier_list: (a) => `Tried to export the supplier list to ${a.destination ?? 'an outside destination'}`,
};

export function describeCall(call: Call, names: Names): string {
  return describers[call.tool]?.(call.args as Record<string, any>, names) ?? `Called ${call.tool}`;
}
