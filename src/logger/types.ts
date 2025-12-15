export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFormat = 'json' | 'text';

export interface LoggerConfig {
  level: LogLevel;
  format: LogFormat;
}
