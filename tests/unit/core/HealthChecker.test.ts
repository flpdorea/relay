import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { HealthChecker } from '../../../src/core/HealthChecker';
import { ServerPool } from '../../../src/core/ServerPool';
import { ILogger } from '../../../src/logger/types';
import { HealthCheckConfig, ServerConfig } from '../../../src/config/types';

describe('HealthChecker', () => {
  let serverPool: ServerPool;
  let logger: ILogger;
  let config: HealthCheckConfig;
  let healthChecker: HealthChecker;
  const mockServerConfigs: ServerConfig[] = [
    { id: 'server-1', host: 'localhost', port: 3001 },
    { id: 'server-2', host: 'localhost', port: 3002 },
  ];

  beforeEach(() => {
    jest.useFakeTimers();

    serverPool = new ServerPool(mockServerConfigs);
    logger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    } as unknown as ILogger;
    config = {
      enabled: true,
      interval: 5000,
      timeout: 3000,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
      path: '/health',
    };
    healthChecker = new HealthChecker(serverPool, config, logger);
  });

  afterEach(() => {
    healthChecker.stop();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create health checker with config', () => {
      expect(healthChecker).toBeDefined();
    });
  });

  describe('start', () => {
    it('should log message when health checks are disabled', () => {
      config.enabled = false;
      healthChecker = new HealthChecker(serverPool, config, logger);
      healthChecker.start();

      expect((logger.info as jest.Mock).mock.calls[0][0]).toBe('Health checks are disabled');
    });

    it('should log startup information when enabled', () => {
      healthChecker.start();

      expect((logger.info as jest.Mock).mock.calls[0][0]).toBe('Starting health checker');
      expect((logger.info as jest.Mock).mock.calls[0][1]).toEqual(
        expect.objectContaining({
          interval: 5000,
          timeout: 3000,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          path: '/health',
        })
      );
    });
  });

  describe('stop', () => {
    it('should stop all health check intervals', () => {
      healthChecker.start();
      healthChecker.stop();

      const infoCalls = (logger.info as jest.Mock).mock.calls;
      const stopCall = infoCalls.find((call) => call[0] === 'Stopping health checker');
      expect(stopCall).toBeDefined();
    });
  });

  describe('removeServer', () => {
    it('should stop health checks for removed server', () => {
      healthChecker.start();

      // Remove server
      healthChecker.removeServer('server-1');

      // Should not throw and should have cleared the interval
      expect(() => healthChecker.removeServer('server-1')).not.toThrow();
    });
  });

  describe('integration with ServerPool', () => {
    it('should have all servers initially healthy', () => {
      expect(serverPool.getHealthy()).toHaveLength(2);
    });
  });
});
