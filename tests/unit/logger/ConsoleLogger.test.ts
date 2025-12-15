import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ConsoleLogger } from '../../../src/logger/ConsoleLogger';
import { LoggerConfig } from '../../../src/logger/types';

describe('ConsoleLogger', () => {
  let stdoutSpy: ReturnType<typeof jest.spyOn>;
  let stderrSpy: ReturnType<typeof jest.spyOn>;
  let originalIsTTY: boolean | undefined;

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

    originalIsTTY = process.stdout.isTTY;

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();

    // Restore TTY setting
    if (originalIsTTY !== undefined) {
      (process.stdout as any).isTTY = originalIsTTY;
    }
  });

  describe('Text format', () => {
    it('should log info messages in text format', () => {
      const config: LoggerConfig = { level: 'info', format: 'text' };
      const logger = new ConsoleLogger(config);

      // Disable TTY for consistent output
      (process.stdout as any).isTTY = false;

      logger.info('Test message');

      expect(stdoutSpy).toHaveBeenCalledWith('2024-01-01T00:00:00.000Z [INFO] Test message\n');
    });

    it('should log error messages in text format to stderr', () => {
      const config: LoggerConfig = { level: 'error', format: 'text' };
      const logger = new ConsoleLogger(config);

      (process.stdout as any).isTTY = false;

      logger.error('Error message');

      expect(stderrSpy).toHaveBeenCalledWith('2024-01-01T00:00:00.000Z [ERROR] Error message\n');
    });

    it('should log debug messages in text format', () => {
      const config: LoggerConfig = { level: 'debug', format: 'text' };
      const logger = new ConsoleLogger(config);

      (process.stdout as any).isTTY = false;

      logger.debug('Debug message');

      expect(stdoutSpy).toHaveBeenCalledWith('2024-01-01T00:00:00.000Z [DEBUG] Debug message\n');
    });

    it('should log warn messages in text format', () => {
      const config: LoggerConfig = { level: 'warn', format: 'text' };
      const logger = new ConsoleLogger(config);

      (process.stdout as any).isTTY = false;

      logger.warn('Warning message');

      expect(stdoutSpy).toHaveBeenCalledWith('2024-01-01T00:00:00.000Z [WARN] Warning message\n');
    });

    it('should include metadata in text format', () => {
      const config: LoggerConfig = { level: 'info', format: 'text' };
      const logger = new ConsoleLogger(config);

      (process.stdout as any).isTTY = false;

      logger.info('Test message', { userId: '123', action: 'login' });

      expect(stdoutSpy).toHaveBeenCalledWith(
        '2024-01-01T00:00:00.000Z [INFO] Test message {"userId":"123","action":"login"}\n'
      );
    });

    it('should include ANSI colors when TTY is enabled', () => {
      const config: LoggerConfig = { level: 'info', format: 'text' };
      const logger = new ConsoleLogger(config);

      (process.stdout as any).isTTY = true;

      logger.info('Test message');

      const output = stdoutSpy.mock.calls[0][0] as string;

      // Should contain ANSI escape codes
      expect(output).toContain('\x1b[');
      expect(output).toContain('Test message');
    });
  });

  describe('JSON format', () => {
    it('should log info messages in JSON format', () => {
      const config: LoggerConfig = { level: 'info', format: 'json' };
      const logger = new ConsoleLogger(config);

      logger.info('Test message');

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());

      expect(parsed).toEqual({
        timestamp: '2024-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Test message',
      });
    });

    it('should log error messages in JSON format to stderr', () => {
      const config: LoggerConfig = { level: 'error', format: 'json' };
      const logger = new ConsoleLogger(config);

      logger.error('Error message');

      const output = stderrSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());

      expect(parsed).toEqual({
        timestamp: '2024-01-01T00:00:00.000Z',
        level: 'error',
        message: 'Error message',
      });
    });

    it('should include metadata in JSON format', () => {
      const config: LoggerConfig = { level: 'info', format: 'json' };
      const logger = new ConsoleLogger(config);

      logger.info('Test message', { userId: '123', action: 'login' });

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());

      expect(parsed).toEqual({
        timestamp: '2024-01-01T00:00:00.000Z',
        level: 'info',
        message: 'Test message',
        userId: '123',
        action: 'login',
      });
    });
  });

  describe('Log level filtering', () => {
    it('should not log debug messages when level is info', () => {
      const config: LoggerConfig = { level: 'info', format: 'text' };
      const logger = new ConsoleLogger(config);

      logger.debug('Debug message');

      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should not log info messages when level is warn', () => {
      const config: LoggerConfig = { level: 'warn', format: 'text' };
      const logger = new ConsoleLogger(config);

      logger.info('Info message');

      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should not log warn messages when level is error', () => {
      const config: LoggerConfig = { level: 'error', format: 'text' };
      const logger = new ConsoleLogger(config);

      logger.warn('Warning message');

      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('should log error messages when level is error', () => {
      const config: LoggerConfig = { level: 'error', format: 'text' };
      const logger = new ConsoleLogger(config);

      logger.error('Error message');

      expect(stderrSpy).toHaveBeenCalled();
    });

    it('should log all messages when level is debug', () => {
      const config: LoggerConfig = { level: 'debug', format: 'text' };
      const logger = new ConsoleLogger(config);

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(stdoutSpy).toHaveBeenCalledTimes(3); // debug, info, warn
      expect(stderrSpy).toHaveBeenCalledTimes(1); // error
    });
  });

  describe('Edge cases', () => {
    it('should handle empty metadata object', () => {
      const config: LoggerConfig = { level: 'info', format: 'text' };
      const logger = new ConsoleLogger(config);

      (process.stdout as any).isTTY = false;

      logger.info('Test message', {});

      expect(stdoutSpy).toHaveBeenCalledWith('2024-01-01T00:00:00.000Z [INFO] Test message\n');
    });

    it('should handle complex metadata objects', () => {
      const config: LoggerConfig = { level: 'info', format: 'json' };
      const logger = new ConsoleLogger(config);

      const complexMeta = {
        user: { id: '123', name: 'John' },
        items: [1, 2, 3],
        active: true,
      };

      logger.info('Test message', complexMeta);

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());

      expect(parsed.user).toEqual({ id: '123', name: 'John' });
      expect(parsed.items).toEqual([1, 2, 3]);
      expect(parsed.active).toBe(true);
    });

    it('should handle special characters in messages', () => {
      const config: LoggerConfig = { level: 'info', format: 'json' };
      const logger = new ConsoleLogger(config);

      logger.info('Message with "quotes" and \n newlines');

      const output = stdoutSpy.mock.calls[0][0] as string;
      const parsed = JSON.parse(output.trim());

      expect(parsed.message).toBe('Message with "quotes" and \n newlines');
    });
  });
});
