import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ConfigLoader, ConfigValidationError } from '../../../src/config/ConfigLoader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ConfigLoader', () => {
  describe('load', () => {
    it('should load a valid configuration file', () => {
      const configPath = path.join(__dirname, '../../../config/config.test.json');
      const config = ConfigLoader.load(configPath);

      expect(config).toBeDefined();
      expect(config.port).toBe(4000);
      expect(config.strategy).toBe('round-robin');
      expect(config.timeout).toBe(5000);
      expect(config.servers).toHaveLength(2);
      expect(config.servers[0].id).toBe('test-server-1');
      expect(config.healthCheck.enabled).toBe(true);
      expect(config.logging.level).toBe('debug');
    });

    it('should throw error for non-existent file', () => {
      expect(() => {
        ConfigLoader.load('/path/to/nonexistent/file.json');
      }).toThrow(ConfigValidationError);
      expect(() => {
        ConfigLoader.load('/path/to/nonexistent/file.json');
      }).toThrow('Configuration file not found');
    });

    it('should throw error for invalid JSON', () => {
      const tempFile = path.join(__dirname, 'temp-invalid.json');
      fs.writeFileSync(tempFile, '{invalid json}', 'utf-8');

      try {
        expect(() => {
          ConfigLoader.load(tempFile);
        }).toThrow(ConfigValidationError);
        expect(() => {
          ConfigLoader.load(tempFile);
        }).toThrow('Invalid JSON');
      } finally {
        fs.unlinkSync(tempFile);
      }
    });
  });

  describe('validate', () => {
    const validConfig = {
      port: 3000,
      strategy: 'round-robin',
      timeout: 30000,
      servers: [
        {
          id: 'server-1',
          host: 'localhost',
          port: 3001,
          weight: 1,
        },
      ],
      healthCheck: {
        enabled: true,
        interval: 5000,
        timeout: 3000,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        path: '/health',
      },
      logging: {
        level: 'info',
        format: 'text',
      },
    };

    it('should validate a correct configuration', () => {
      const config = ConfigLoader.validate(validConfig);
      expect(config).toBeDefined();
      expect(config.port).toBe(3000);
    });

    it('should throw error if config is not an object', () => {
      expect(() => ConfigLoader.validate(null)).toThrow(ConfigValidationError);
      expect(() => ConfigLoader.validate(null)).toThrow('Configuration must be an object');

      expect(() => ConfigLoader.validate('string')).toThrow(ConfigValidationError);
      expect(() => ConfigLoader.validate('string')).toThrow('Configuration must be an object');

      expect(() => ConfigLoader.validate(123)).toThrow(ConfigValidationError);
      expect(() => ConfigLoader.validate(123)).toThrow('Configuration must be an object');

      expect(() => ConfigLoader.validate([])).toThrow(ConfigValidationError);
      expect(() => ConfigLoader.validate([])).toThrow('Configuration must be an object');
    });

    describe('port validation', () => {
      it('should throw error if port is not a number', () => {
        const config = { ...validConfig, port: '3000' };
        expect(() => ConfigLoader.validate(config)).toThrow('port must be a number');
      });

      it('should throw error if port is not an integer', () => {
        const config = { ...validConfig, port: 3000.5 };
        expect(() => ConfigLoader.validate(config)).toThrow('port must be an integer');
      });

      it('should throw error if port is out of range', () => {
        const config1 = { ...validConfig, port: 0 };
        expect(() => ConfigLoader.validate(config1)).toThrow('port must be between 1 and 65535');

        const config2 = { ...validConfig, port: 65536 };
        expect(() => ConfigLoader.validate(config2)).toThrow('port must be between 1 and 65535');
      });
    });

    describe('strategy validation', () => {
      it('should accept valid strategies', () => {
        const strategies = ['round-robin', 'least-connections', 'weighted', 'random'];
        strategies.forEach((strategy) => {
          const config = { ...validConfig, strategy };
          expect(() => ConfigLoader.validate(config)).not.toThrow();
        });
      });

      it('should throw error for invalid strategy', () => {
        const config = { ...validConfig, strategy: 'invalid-strategy' };
        expect(() => ConfigLoader.validate(config)).toThrow('strategy must be one of');
      });

      it('should throw error if strategy is not a string', () => {
        const config = { ...validConfig, strategy: 123 };
        expect(() => ConfigLoader.validate(config)).toThrow('strategy must be a string');
      });
    });

    describe('timeout validation', () => {
      it('should throw error if timeout is not a number', () => {
        const config = { ...validConfig, timeout: '30000' };
        expect(() => ConfigLoader.validate(config)).toThrow('timeout must be a number');
      });

      it('should throw error if timeout is not an integer', () => {
        const config = { ...validConfig, timeout: 30000.5 };
        expect(() => ConfigLoader.validate(config)).toThrow('timeout must be an integer');
      });

      it('should throw error if timeout is negative', () => {
        const config = { ...validConfig, timeout: -1 };
        expect(() => ConfigLoader.validate(config)).toThrow('timeout must be non-negative');
      });

      it('should accept zero timeout', () => {
        const config = { ...validConfig, timeout: 0 };
        expect(() => ConfigLoader.validate(config)).not.toThrow();
      });
    });

    describe('servers validation', () => {
      it('should throw error if servers is not an array', () => {
        const config = { ...validConfig, servers: {} };
        expect(() => ConfigLoader.validate(config)).toThrow('servers must be an array');
      });

      it('should throw error if servers array is empty', () => {
        const config = { ...validConfig, servers: [] };
        expect(() => ConfigLoader.validate(config)).toThrow('servers array cannot be empty');
      });

      it('should throw error if server is not an object', () => {
        const config = { ...validConfig, servers: ['not-an-object'] };
        expect(() => ConfigLoader.validate(config)).toThrow('servers[0] must be an object');
      });

      it('should throw error if server id is missing or invalid', () => {
        const config1 = {
          ...validConfig,
          servers: [{ host: 'localhost', port: 3001 }],
        };
        expect(() => ConfigLoader.validate(config1)).toThrow('servers[0].id must be a string');

        const config2 = {
          ...validConfig,
          servers: [{ id: '', host: 'localhost', port: 3001 }],
        };
        expect(() => ConfigLoader.validate(config2)).toThrow('servers[0].id cannot be empty');
      });

      it('should throw error for duplicate server ids', () => {
        const config = {
          ...validConfig,
          servers: [
            { id: 'server-1', host: 'localhost', port: 3001 },
            { id: 'server-1', host: 'localhost', port: 3002 },
          ],
        };
        expect(() => ConfigLoader.validate(config)).toThrow('Duplicate server id: server-1');
      });

      it('should throw error if server host is missing or invalid', () => {
        const config1 = {
          ...validConfig,
          servers: [{ id: 'server-1', port: 3001 }],
        };
        expect(() => ConfigLoader.validate(config1)).toThrow('servers[0].host must be a string');

        const config2 = {
          ...validConfig,
          servers: [{ id: 'server-1', host: '', port: 3001 }],
        };
        expect(() => ConfigLoader.validate(config2)).toThrow('servers[0].host cannot be empty');
      });

      it('should throw error if server port is invalid', () => {
        const config = {
          ...validConfig,
          servers: [{ id: 'server-1', host: 'localhost', port: 'invalid' }],
        };
        expect(() => ConfigLoader.validate(config)).toThrow('port must be a number');
      });

      it('should validate optional weight', () => {
        const config = {
          ...validConfig,
          servers: [{ id: 'server-1', host: 'localhost', port: 3001, weight: 5 }],
        };
        const validated = ConfigLoader.validate(config);
        expect(validated.servers[0].weight).toBe(5);
      });

      it('should throw error if weight is invalid', () => {
        const config1 = {
          ...validConfig,
          servers: [
            {
              id: 'server-1',
              host: 'localhost',
              port: 3001,
              weight: 'invalid',
            },
          ],
        };
        expect(() => ConfigLoader.validate(config1)).toThrow('servers[0].weight must be a number');

        const config2 = {
          ...validConfig,
          servers: [{ id: 'server-1', host: 'localhost', port: 3001, weight: 0 }],
        };
        expect(() => ConfigLoader.validate(config2)).toThrow('servers[0].weight must be at least 1');

        const config3 = {
          ...validConfig,
          servers: [{ id: 'server-1', host: 'localhost', port: 3001, weight: 1.5 }],
        };
        expect(() => ConfigLoader.validate(config3)).toThrow('servers[0].weight must be an integer');
      });
    });

    describe('healthCheck validation', () => {
      it('should throw error if healthCheck is not an object', () => {
        const config = { ...validConfig, healthCheck: 'invalid' };
        expect(() => ConfigLoader.validate(config)).toThrow('healthCheck must be an object');
      });

      it('should throw error if enabled is not a boolean', () => {
        const config = {
          ...validConfig,
          healthCheck: { ...validConfig.healthCheck, enabled: 'true' },
        };
        expect(() => ConfigLoader.validate(config)).toThrow('healthCheck.enabled must be a boolean');
      });

      it('should throw error if interval is invalid', () => {
        const config1 = {
          ...validConfig,
          healthCheck: { ...validConfig.healthCheck, interval: 'invalid' },
        };
        expect(() => ConfigLoader.validate(config1)).toThrow('healthCheck.interval must be a number');

        const config2 = {
          ...validConfig,
          healthCheck: { ...validConfig.healthCheck, interval: 0 },
        };
        expect(() => ConfigLoader.validate(config2)).toThrow('healthCheck.interval must be positive');

        const config3 = {
          ...validConfig,
          healthCheck: { ...validConfig.healthCheck, interval: 5000.5 },
        };
        expect(() => ConfigLoader.validate(config3)).toThrow('healthCheck.interval must be an integer');
      });

      it('should throw error if timeout is invalid', () => {
        const config = {
          ...validConfig,
          healthCheck: { ...validConfig.healthCheck, timeout: 0 },
        };
        expect(() => ConfigLoader.validate(config)).toThrow('healthCheck.timeout must be positive');
      });

      it('should throw error if healthyThreshold is invalid', () => {
        const config = {
          ...validConfig,
          healthCheck: { ...validConfig.healthCheck, healthyThreshold: 0 },
        };
        expect(() => ConfigLoader.validate(config)).toThrow('healthCheck.healthyThreshold must be at least 1');
      });

      it('should throw error if unhealthyThreshold is invalid', () => {
        const config = {
          ...validConfig,
          healthCheck: { ...validConfig.healthCheck, unhealthyThreshold: 0 },
        };
        expect(() => ConfigLoader.validate(config)).toThrow('healthCheck.unhealthyThreshold must be at least 1');
      });

      it('should validate optional path', () => {
        const config = {
          ...validConfig,
          healthCheck: { ...validConfig.healthCheck, path: '/custom-health' },
        };
        const validated = ConfigLoader.validate(config);
        expect(validated.healthCheck.path).toBe('/custom-health');
      });

      it('should throw error if path does not start with /', () => {
        const config = {
          ...validConfig,
          healthCheck: { ...validConfig.healthCheck, path: 'health' },
        };
        expect(() => ConfigLoader.validate(config)).toThrow('healthCheck.path must start with /');
      });

      it('should allow healthCheck without path', () => {
        const configWithoutPath = {
          ...validConfig,
          healthCheck: {
            enabled: true,
            interval: 5000,
            timeout: 3000,
            healthyThreshold: 2,
            unhealthyThreshold: 3,
          },
        };
        const validated = ConfigLoader.validate(configWithoutPath);
        expect(validated.healthCheck.path).toBeUndefined();
      });
    });

    describe('logging validation', () => {
      it('should throw error if logging is not an object', () => {
        const config = { ...validConfig, logging: 'invalid' };
        expect(() => ConfigLoader.validate(config)).toThrow('logging must be an object');
      });

      it('should accept valid log levels', () => {
        const levels = ['debug', 'info', 'warn', 'error'];
        levels.forEach((level) => {
          const config = {
            ...validConfig,
            logging: { ...validConfig.logging, level },
          };
          expect(() => ConfigLoader.validate(config)).not.toThrow();
        });
      });

      it('should throw error for invalid log level', () => {
        const config = {
          ...validConfig,
          logging: { ...validConfig.logging, level: 'invalid' },
        };
        expect(() => ConfigLoader.validate(config)).toThrow('logging.level must be one of');
      });

      it('should accept valid log formats', () => {
        const formats = ['json', 'text'];
        formats.forEach((format) => {
          const config = {
            ...validConfig,
            logging: { ...validConfig.logging, format },
          };
          expect(() => ConfigLoader.validate(config)).not.toThrow();
        });
      });

      it('should throw error for invalid log format', () => {
        const config = {
          ...validConfig,
          logging: { ...validConfig.logging, format: 'invalid' },
        };
        expect(() => ConfigLoader.validate(config)).toThrow('logging.format must be one of');
      });
    });
  });
});
