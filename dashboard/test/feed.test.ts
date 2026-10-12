import { describe, expect, it } from 'vitest';
import type { RunEvent } from '../src/api';
import { pendingApproval, toFeedRows } from '../src/feed';

const at = '2026-10-12T10:00:00.000Z';
const event = (type: string, fields: Record<string, unknown> = {}): RunEvent => ({ type, at, ...fields });

describe('toFeedRows', () => {
  it('marks a tool ArmorIQ let run as allowed', () => {
    const rows = toFeedRows([event('call', { tool: 'place_order', args: { amount: 20000 } }), event('allowed', { tool: 'place_order' }), event('tool_result', { tool: 'place_order', result: '{}' })]);
    expect(rows).toMatchObject([{ tool: 'place_order', verdict: 'allowed', args: { amount: 20000 } }]);
  });

  it('keeps the ArmorIQ block reason even though the tool then errors', () => {
    const rows = toFeedRows([
      event('call', { tool: 'update_payee_bank' }),
      event('block', { tool: 'update_payee_bank', reason: 'payee-and-destructive-denied' }),
      event('tool_error', { tool: 'update_payee_bank', error: 'ArmorIQ block' }),
    ]);
    expect(rows).toMatchObject([{ verdict: 'blocked', reason: 'payee-and-destructive-denied' }]);
  });

  it('shows held, then approved, and stays approved when the tool runs', () => {
    const events = [event('call', { tool: 'place_order' }), event('hold', { tool: 'place_order', reason: 'over limit' })];
    expect(toFeedRows(events)[0].verdict).toBe('held');
    expect(toFeedRows([...events, event('approved', { tool: 'place_order' }), event('allowed', { tool: 'place_order' })])[0].verdict).toBe('approved');
  });

  it('labels tools that ran with ArmorIQ off as ran', () => {
    expect(toFeedRows([event('call', { tool: 'update_payee_bank' }), event('tool_result', { tool: 'update_payee_bank' })])[0].verdict).toBe('ran');
  });
});

describe('pendingApproval', () => {
  it('returns the held call with the owner decision once recorded', () => {
    const events = [event('call', { tool: 'place_order', args: { amount: 200000 } }), event('hold', { tool: 'place_order' })];
    expect(pendingApproval(events)).toMatchObject({ verdict: 'held', ownerDecision: undefined });
    expect(pendingApproval([...events, event('approval_decided', { decision: 'approve' })])).toMatchObject({ ownerDecision: 'approve' });
  });

  it('is empty once the hold is resolved', () => {
    expect(pendingApproval([event('call', { tool: 'place_order' }), event('hold', { tool: 'place_order' }), event('approved', { tool: 'place_order' })])).toBeUndefined();
  });
});
