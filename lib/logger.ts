// lib/logger.ts
// ─── Structured logger — zero dependencies ───────────────────
// Usage: import { logger } from '@/lib/logger';
//        logger.info('AI', 'Roadmap generated', { phases: 5 });

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  context: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

function formatEntry(entry: LogEntry): string {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`;
  return `${prefix} ${entry.message}`;
}

function createEntry(
  level: LogLevel,
  context: string,
  message: string,
  data?: Record<string, unknown>
): LogEntry {
  return {
    level,
    context,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

function log(level: LogLevel, context: string, message: string, data?: Record<string, unknown>) {
  const entry = createEntry(level, context, message, data);
  const formatted = formatEntry(entry);

  switch (level) {
    case 'error':
      console.error(formatted, data ?? '');
      break;
    case 'warn':
      console.warn(formatted, data ?? '');
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatted, data ?? '');
      }
      break;
    default:
      console.log(formatted, data ?? '');
  }
}

export const logger = {
  info:  (context: string, message: string, data?: Record<string, unknown>) => log('info', context, message, data),
  warn:  (context: string, message: string, data?: Record<string, unknown>) => log('warn', context, message, data),
  error: (context: string, message: string, data?: Record<string, unknown>) => log('error', context, message, data),
  debug: (context: string, message: string, data?: Record<string, unknown>) => log('debug', context, message, data),
};
