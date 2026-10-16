import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type RunEvent, type RunRequest } from './api';
import { isEndOfRun } from './feed';

export type Turn = { id: string; request: RunRequest; runId: string | null; events: RunEvent[]; startError: string | null };

/** The conversation: one turn per prompt, each collecting its run's live SSE events. */
export function useRun() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const stream = useRef<EventSource | null>(null);

  const update = (id: string, change: (turn: Turn) => Turn) =>
    setTurns((previous) => previous.map((turn) => (turn.id === id ? change(turn) : turn)));

  const start = useCallback(async (request: RunRequest) => {
    stream.current?.close();
    const id = crypto.randomUUID();
    setTurns((previous) => [...previous, { id, request, runId: null, events: [], startError: null }]);
    try {
      const { runId } = await api.startRun(request);
      update(id, (turn) => ({ ...turn, runId }));
      const source = api.runEvents(runId);
      source.onmessage = (message) => {
        const event = JSON.parse(message.data) as RunEvent;
        update(id, (turn) => ({ ...turn, events: [...turn.events, event] }));
        if (isEndOfRun(event)) source.close();
      };
      stream.current = source;
    } catch (error) {
      update(id, (turn) => ({ ...turn, startError: (error as Error).message }));
    }
  }, []);

  /** Back to the welcome screen (used by the hidden presenter reset). */
  const clear = useCallback(() => {
    stream.current?.close();
    setTurns([]);
  }, []);

  useEffect(() => () => stream.current?.close(), []);

  const current = turns.at(-1);
  const running = !!current && current.startError === null && !current.events.some(isEndOfRun);
  return { turns, current, running, start, clear };
}
