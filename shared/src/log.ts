// One readable line per event: `ISO LEVEL [service] event key=value ...`
// Event names follow `area.action.outcome`; see docs/BLUEPRINT.md §13.

const levelRank = { debug: 10, info: 20, warn: 30, error: 40 } as const;
const maxValueLength = 200;

export type LogLevel = keyof typeof levelRank;
export type LogFields = Record<string, unknown>;
export type Logger = Record<LogLevel, (event: string, fields?: LogFields) => void> & {
  child: (fields: LogFields) => Logger;
};

export function createLogger(service: string, level: LogLevel = 'info', context: LogFields = {}): Logger {
  const write = (lineLevel: LogLevel) => (event: string, fields: LogFields = {}) => {
    if (levelRank[lineLevel] < levelRank[level]) return;
    const pairs = formatFields({ ...context, ...fields });
    const line = `${new Date().toISOString()} ${lineLevel.toUpperCase().padEnd(5)} [${service}] ${event}`;
    process.stdout.write(pairs ? `${line} ${pairs}\n` : `${line}\n`);
  };

  return {
    debug: write('debug'),
    info: write('info'),
    warn: write('warn'),
    error: write('error'),
    child: (fields) => createLogger(service, level, { ...context, ...fields }),
  };
}

function formatFields(fields: LogFields): string {
  return Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${formatValue(value)}`)
    .join(' ');
}

function formatValue(value: unknown): string {
  const text =
    value instanceof Error ? JSON.stringify(value.message)
    : typeof value === 'string' && !/\s/.test(value) ? value
    : JSON.stringify(value);
  return text.length > maxValueLength ? `${text.slice(0, maxValueLength)}…` : text;
}
