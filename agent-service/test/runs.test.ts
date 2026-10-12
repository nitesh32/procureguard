import { createLogger } from '@procureguard/shared/log';
import { describe, expect, it } from 'vitest';
import { createRunRegistry, isEndOfRun } from '../src/runs';

const registry = () => createRunRegistry(createLogger('test', 'error'));

describe('run registry', () => {
  it('stores events in order and streams them to subscribers', () => {
    const runs = registry();
    runs.start('r1');
    const streamed: string[] = [];
    runs.subscribe('r1', (event) => streamed.push(event.type));

    runs.record('r1', 'call', { tool: 'place_order' });
    runs.record('r1', 'block', { tool: 'update_payee_bank', reason: 'policy' });

    expect(runs.events('r1').map((event) => event.type)).toEqual(['call', 'block']);
    expect(streamed).toEqual(['call', 'block']);
  });

  it('stops streaming after unsubscribe', () => {
    const runs = registry();
    runs.start('r1');
    const streamed: string[] = [];
    const unsubscribe = runs.subscribe('r1', (event) => streamed.push(event.type));
    unsubscribe();
    runs.record('r1', 'call');
    expect(streamed).toEqual([]);
  });

  it('knows which events end a run', () => {
    expect(isEndOfRun({ type: 'final', at: '' })).toBe(true);
    expect(isEndOfRun({ type: 'run_failed', at: '' })).toBe(true);
    expect(isEndOfRun({ type: 'hold', at: '' })).toBe(false);
  });

  it('rejects events for unknown runs', () => {
    expect(() => registry().record('nope', 'call')).toThrow(/Unknown run/);
  });
});
