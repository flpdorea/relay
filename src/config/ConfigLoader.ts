/**
 * ConfigLoader - Loads and validates JSON configuration
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  LoadBalancerConfig,
  ServerConfig,
  HealthCheckConfig,
  LoggingConfig,
  StrategyType,
} from './types';

/**
 * Custom error for configuration validation failures
 */
export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * ConfigLoader class - Handles loading and validating configuration files
 */
export class ConfigLoader {
  /**
   * Load configuration from a JSON file
   * @param filePath Path to the configuration file
   * @returns Validated LoadBalancerConfig
   * @throws ConfigValidationError if validation fails
   */
  static load(filePath: string): LoadBalancerConfig {
    // Verify file exists
    if (!fs.existsSync(filePath)) {
      throw new ConfigValidationError(
        `Configuration file not found: ${filePath}`
      );
    }

    // Read and parse JSON
    let rawConfig: unknown;
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      rawConfig = JSON.parse(fileContent);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ConfigValidationError(
          `Invalid JSON in configuration file: ${error.message}`
        );
      }
      throw new ConfigValidationError(
        `Failed to read configuration file: ${(error as Error).message}`
      );
    }

    // Validate and return
    return this.validate(rawConfig);
  }

  /**
   * Validate a configuration object
   * @param config Raw configuration object
   * @returns Validated LoadBalancerConfig
   * @throws ConfigValidationError if validation fails
   */
  static validate(config: unknown): LoadBalancerConfig {
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      throw new ConfigValidationError('Configuration must be an object');
    }

    const cfg = config as Record<string, unknown>;

    // Validate port
    const port = this.validatePort(cfg.port);

    // Validate strategy
    const strategy = this.validateStrategy(cfg.strategy);

    // Validate timeout
    const timeout = this.validateTimeout(cfg.timeout);

    // Validate servers
    const servers = this.validateServers(cfg.servers);

    // Validate health check
    const healthCheck = this.validateHealthCheck(cfg.healthCheck);

    // Validate logging
    const logging = this.validateLogging(cfg.logging);

    return {
      port,
      strategy,
      timeout,
      servers,
      healthCheck,
      logging,
    };
  }

  /**
   * Validate port number
   */
  private static validatePort(port: unknown): number {
    if (typeof port !== 'number') {
      throw new ConfigValidationError('port must be a number');
    }

    if (!Number.isInteger(port)) {
      throw new ConfigValidationError('port must be an integer');
    }

    if (port < 1 || port > 65535) {
      throw new ConfigValidationError('port must be between 1 and 65535');
    }

    return port;
  }

  /**
   * Validate strategy type
   */
  private static validateStrategy(strategy: unknown): StrategyType {
    if (typeof strategy !== 'string') {
      throw new ConfigValidationError('strategy must be a string');
    }

    const validStrategies: StrategyType[] = [
      'round-robin',
      'least-connections',
      'weighted',
      'random',
    ];

    if (!validStrategies.includes(strategy as StrategyType)) {
      throw new ConfigValidationError(
        `strategy must be one of: ${validStrategies.join(', ')}`
      );
    }

    return strategy as StrategyType;
  }

  /**
   * Validate timeout value
   */
  private static validateTimeout(timeout: unknown): number {
    if (typeof timeout !== 'number') {
      throw new ConfigValidationError('timeout must be a number');
    }

    if (!Number.isInteger(timeout)) {
      throw new ConfigValidationError('timeout must be an integer');
    }

    if (timeout < 0) {
      throw new ConfigValidationError('timeout must be non-negative');
    }

    return timeout;
  }

  /**
   * Validate servers array
   */
  private static validateServers(servers: unknown): ServerConfig[] {
    if (!Array.isArray(servers)) {
      throw new ConfigValidationError('servers must be an array');
    }

    if (servers.length === 0) {
      throw new ConfigValidationError('servers array cannot be empty');
    }

    const serverIds = new Set<string>();

    return servers.map((server, index) => {
      if (typeof server !== 'object' || server === null) {
        throw new ConfigValidationError(
          `servers[${index}] must be an object`
        );
      }

      const srv = server as Record<string, unknown>;

      // Validate id
      if (typeof srv.id !== 'string') {
        throw new ConfigValidationError(
          `servers[${index}].id must be a string`
        );
      }

      if (srv.id.trim() === '') {
        throw new ConfigValidationError(
          `servers[${index}].id cannot be empty`
        );
      }

      // Check for duplicate IDs
      if (serverIds.has(srv.id)) {
        throw new ConfigValidationError(
          `Duplicate server id: ${srv.id}`
        );
      }
      serverIds.add(srv.id);

      // Validate host
      if (typeof srv.host !== 'string') {
        throw new ConfigValidationError(
          `servers[${index}].host must be a string`
        );
      }

      if (srv.host.trim() === '') {
        throw new ConfigValidationError(
          `servers[${index}].host cannot be empty`
        );
      }

      // Validate port
      const port = this.validatePort(srv.port);

      // Validate weight (optional)
      let weight: number | undefined;
      if (srv.weight !== undefined) {
        if (typeof srv.weight !== 'number') {
          throw new ConfigValidationError(
            `servers[${index}].weight must be a number`
          );
        }

        if (!Number.isInteger(srv.weight)) {
          throw new ConfigValidationError(
            `servers[${index}].weight must be an integer`
          );
        }

        if (srv.weight < 1) {
          throw new ConfigValidationError(
            `servers[${index}].weight must be at least 1`
          );
        }

        weight = srv.weight;
      }

      return {
        id: srv.id,
        host: srv.host,
        port,
        weight,
      };
    });
  }

  /**
   * Validate health check configuration
   */
  private static validateHealthCheck(healthCheck: unknown): HealthCheckConfig {
    if (typeof healthCheck !== 'object' || healthCheck === null) {
      throw new ConfigValidationError('healthCheck must be an object');
    }

    const hc = healthCheck as Record<string, unknown>;

    // Validate enabled
    if (typeof hc.enabled !== 'boolean') {
      throw new ConfigValidationError('healthCheck.enabled must be a boolean');
    }

    // Validate interval
    if (typeof hc.interval !== 'number') {
      throw new ConfigValidationError('healthCheck.interval must be a number');
    }

    if (!Number.isInteger(hc.interval)) {
      throw new ConfigValidationError(
        'healthCheck.interval must be an integer'
      );
    }

    if (hc.interval <= 0) {
      throw new ConfigValidationError(
        'healthCheck.interval must be positive'
      );
    }

    // Validate timeout
    if (typeof hc.timeout !== 'number') {
      throw new ConfigValidationError('healthCheck.timeout must be a number');
    }

    if (!Number.isInteger(hc.timeout)) {
      throw new ConfigValidationError(
        'healthCheck.timeout must be an integer'
      );
    }

    if (hc.timeout <= 0) {
      throw new ConfigValidationError('healthCheck.timeout must be positive');
    }

    // Validate healthyThreshold
    if (typeof hc.healthyThreshold !== 'number') {
      throw new ConfigValidationError(
        'healthCheck.healthyThreshold must be a number'
      );
    }

    if (!Number.isInteger(hc.healthyThreshold)) {
      throw new ConfigValidationError(
        'healthCheck.healthyThreshold must be an integer'
      );
    }

    if (hc.healthyThreshold < 1) {
      throw new ConfigValidationError(
        'healthCheck.healthyThreshold must be at least 1'
      );
    }

    // Validate unhealthyThreshold
    if (typeof hc.unhealthyThreshold !== 'number') {
      throw new ConfigValidationError(
        'healthCheck.unhealthyThreshold must be a number'
      );
    }

    if (!Number.isInteger(hc.unhealthyThreshold)) {
      throw new ConfigValidationError(
        'healthCheck.unhealthyThreshold must be an integer'
      );
    }

    if (hc.unhealthyThreshold < 1) {
      throw new ConfigValidationError(
        'healthCheck.unhealthyThreshold must be at least 1'
      );
    }

    // Validate path (optional)
    let healthPath: string | undefined;
    if (hc.path !== undefined) {
      if (typeof hc.path !== 'string') {
        throw new ConfigValidationError('healthCheck.path must be a string');
      }

      if (!hc.path.startsWith('/')) {
        throw new ConfigValidationError(
          'healthCheck.path must start with /'
        );
      }

      healthPath = hc.path;
    }

    return {
      enabled: hc.enabled,
      interval: hc.interval,
      timeout: hc.timeout,
      healthyThreshold: hc.healthyThreshold,
      unhealthyThreshold: hc.unhealthyThreshold,
      path: healthPath,
    };
  }

  /**
   * Validate logging configuration
   */
  private static validateLogging(logging: unknown): LoggingConfig {
    if (typeof logging !== 'object' || logging === null) {
      throw new ConfigValidationError('logging must be an object');
    }

    const log = logging as Record<string, unknown>;

    // Validate level
    if (typeof log.level !== 'string') {
      throw new ConfigValidationError('logging.level must be a string');
    }

    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(log.level)) {
      throw new ConfigValidationError(
        `logging.level must be one of: ${validLevels.join(', ')}`
      );
    }

    // Validate format
    if (typeof log.format !== 'string') {
      throw new ConfigValidationError('logging.format must be a string');
    }

    const validFormats = ['json', 'text'];
    if (!validFormats.includes(log.format)) {
      throw new ConfigValidationError(
        `logging.format must be one of: ${validFormats.join(', ')}`
      );
    }

    return {
      level: log.level as 'debug' | 'info' | 'warn' | 'error',
      format: log.format as 'json' | 'text',
    };
  }
}
