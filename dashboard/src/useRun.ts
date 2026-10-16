import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type RunEvent, type RunRequest } from './api';
import { isEndOfRun } from './feed';

/** Starts a run and collects its live events from the SSE stream. */
export function useRun() {
  const [runId, setRunId] = useState<string | null>(null);
  const [request, setRequest] = useState<RunRequest | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [startError, setStartError] = useState<string | null>(null);
  const stream = useRef<EventSource | null>(null);

  const start = useCallback(async (next: RunRequest) => {
    stream.current?.close();
    setEvents([]);
    setStartError(null);
    setRequest(next);
    try {
      const { runId: id } = await api.startRun(next);
      setRunId(id);
      const source = api.runEvents(id);
      source.onmessage = (message) => {
        const event = JSON.parse(message.data) as RunEvent;
        setEvents((previous) => [...previous, event]);
        if (isEndOfRun(event)) source.close();
      };
      stream.current = source;
    } catch (error) {
      setStartError((error as Error).message);
    }
  }, []);

  /** Back to the idle screen (used by the hidden presenter reset). */
  const clear = useCallback(() => {
    stream.current?.close();
    setRunId(null);
    setRequest(null);
    setEvents([]);
    setStartError(null);
  }, []);

  useEffect(() => () => stream.current?.close(), []);

  const running = runId !== null && startError === null && !events.some(isEndOfRun);
  return { runId, request, events, running, startError, start, clear };
}
