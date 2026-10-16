import { describe, expect, it } from 'vitest';
import type { RunEvent } from '../src/api';
import { describeCall, summarize, toCalls } from '../src/feed';

const at = '2026-10-16T10:00:00.000Z';
const event = (type: string, fields: Record<string, unknown> = {}): RunEvent => ({ type, at, ...fields });
const names = { suppliers: { 'SUP-03': 'Apex Components' }, items: { 'BRK-PAD-01': 'Brake pad set' } };

describe('toCalls', () => {
  it('resolves parallel calls of the same tool by call id (no row stuck on checking)', () => {
    const calls = toCalls([
      event('call', { callId: 'a', tool: 'get_quote', args: { sku: 'BRK-PAD-01' } }),
      event('call', { callId: 'b', tool: 'get_quote', args: { sku: 'ENG-GSK-02' } }),
      event('allowed', { callId: 'b', tool: 'get_quote' }),
      event('allowed', { callId: 'a', tool: 'get_quote' }),
    ]);
    expect(calls.map((call) => call.verdict)).toEqual(['allowed', 'allowed']);
  });

  it('matches ArmorIQ block events to the oldest call still being checked, and keeps the block over the tool error', () => {
    const calls = toCalls([
      event('call', { callId: 'a', tool: 'update_payee_bank', args: { supplierId: 'SUP-03' } }),
      event('block', { tool: 'update_payee_bank', reason: 'tool_denied' }),
      event('tool_error', { callId: 'a', tool: 'update_payee_bank', error: 'ArmorIQ block' }),
    ]);
    expect(calls[0]).toMatchObject({ verdict: 'blocked', reason: 'tool_denied' });
  });

  it('follows a hold through to approval or timeout', () => {
    const held = [event('call', { callId: 'a', tool: 'place_order', args: { amount: 20000 } }), event('hold', { tool: 'place_order', reason: 'rule_action_hold' })];
    expect(toCalls(held)[0]).toMatchObject({ verdict: 'held', wasHeld: true });
    expect(toCalls([...held, event('approved', { tool: 'place_order' }), event('allowed', { callId: 'a', tool: 'place_order' })])[0].verdict).toBe('approved');
    expect(toCalls([...held, event('timeout', { tool: 'place_order' })])[0].verdict).toBe('rejected');
  });

  it('marks calls without a verdict once the run has ended', () => {
    expect(toCalls([event('call', { callId: 'a', tool: 'get_quote' }), event('final', { answer: 'done' })])[0].verdict).toBe('no-verdict');
  });
});

describe('summarize', () => {
  it('counts verdicts and sums the money ArmorIQ protected', () => {
    const calls = toCalls([
      event('call', { callId: 'a', tool: 'check_inventory' }),
      event('allowed', { callId: 'a', tool: 'check_inventory' }),
      event('call', { callId: 'b', tool: 'place_order', args: { amount: 20000 } }),
      event('hold', { tool: 'place_order' }),
      event('call', { callId: 'c', tool: 'update_payee_bank', args: {} }),
      event('block', { tool: 'update_payee_bank' }),
    ]);
    expect(summarize(calls)).toEqual({ total: 3, allowed: 1, held: 1, blocked: 1, protectedAmount: 20000 });
  });
});

describe('describeCall', () => {
  it('turns a call into a plain-language sentence', () => {
    const [call] = toCalls([event('call', { callId: 'a', tool: 'update_payee_bank', args: { supplierId: 'SUP-03' } })]);
    expect(describeCall(call, names)).toBe("Tried to change Apex Components' payee bank account");
  });
});
