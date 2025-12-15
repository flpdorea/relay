import { Logger } from './Logger';
import { LogLevel, LoggerConfig } from './types';

const COLORS = {
  reset: '\x1b[0m',
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m', // Green
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
  gray: '\x1b[90m', // Gray for metadata
};

export class ConsoleLogger extends Logger {
  constructor(config: LoggerConfig) {
    super(config);
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private formatTextMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const timestamp = this.formatTimestamp();
    const levelUpper = level.toUpperCase();

    const useColors = process.stdout.isTTY;

    let output = '';

    if (useColors) {
      const color = COLORS[level];
      output = `${COLORS.gray}${timestamp}${COLORS.reset} ${color}[${levelUpper}]${COLORS.reset} ${message}`;
    } else {
      output = `${timestamp} [${levelUpper}] ${message}`;
    }

    if (meta && Object.keys(meta).length > 0) {
      const metaStr = JSON.stringify(meta);
      if (useColors) {
        output += ` ${COLORS.gray}${metaStr}${COLORS.reset}`;
      } else {
        output += ` ${metaStr}`;
      }
    }

    return output;
  }

  private formatJsonMessage(level: LogLevel, message: string, meta?: Record<string, unknown>): string {
    const logEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      ...meta,
    };

    return JSON.stringify(logEntry);
  }

  protected log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const formattedMessage =
      this.config.format === 'json'
        ? this.formatJsonMessage(level, message, meta)
        : this.formatTextMessage(level, message, meta);

    if (level === 'error') {
      process.stderr.write(formattedMessage + '\n');
    } else {
      process.stdout.write(formattedMessage + '\n');
    }
  }
}
