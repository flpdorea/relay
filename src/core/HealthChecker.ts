import { Server } from './types';
import { ServerPool } from './ServerPool';
import { ILogger } from '../logger/types';
import { HealthCheckConfig } from '../config/types';
import * as http from 'http';

export class HealthChecker {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    private serverPool: ServerPool,
    private config: HealthCheckConfig,
    private logger: ILogger
  ) {}

  start(): void {
    if (!this.config.enabled) {
      this.logger.info('Health checks are disabled');
      return;
    }

    this.logger.info('Starting health checker', {
      interval: this.config.interval,
      timeout: this.config.timeout,
      healthyThreshold: this.config.healthyThreshold,
      unhealthyThreshold: this.config.unhealthyThreshold,
      path: this.config.path,
    });

    const servers = this.serverPool.getAll();
    for (const server of servers) {
      this.startCheckingServer(server);
    }
  }

  stop(): void {
    this.logger.info('Stopping health checker');
    for (const [serverId, interval] of this.intervals) {
      clearInterval(interval);
      this.intervals.delete(serverId);
    }
  }

  private startCheckingServer(server: Server): void {
    let consecutiveSuccesses = 0;
    let consecutiveFailures = 0;

    const checkServer = async (): Promise<void> => {
      try {
        const isHealthy = await this.performHealthCheck(server);

        if (isHealthy) {
          consecutiveSuccesses++;
          consecutiveFailures = 0;

          if (!server.healthy && consecutiveSuccesses >= this.config.healthyThreshold) {
            this.serverPool.setHealthStatus(server.id, true);
            this.logger.info(`Server ${server.id} is now healthy`, {
              serverId: server.id,
              host: server.host,
              port: server.port,
              consecutiveSuccesses,
            });
          }
        } else {
          consecutiveFailures++;
          consecutiveSuccesses = 0;

          if (server.healthy && consecutiveFailures >= this.config.unhealthyThreshold) {
            this.serverPool.setHealthStatus(server.id, false);
            this.logger.warn(`Server ${server.id} is now unhealthy`, {
              serverId: server.id,
              host: server.host,
              port: server.port,
              consecutiveFailures,
            });
          }
        }
      } catch (error) {
        consecutiveFailures++;
        consecutiveSuccesses = 0;

        if (server.healthy && consecutiveFailures >= this.config.unhealthyThreshold) {
          this.serverPool.setHealthStatus(server.id, false);
          this.logger.warn(`Server ${server.id} is now unhealthy due to error`, {
            serverId: server.id,
            host: server.host,
            port: server.port,
            consecutiveFailures,
            error: (error as Error).message,
          });
        }
      }
    };

    // Perform initial check immediately
    void checkServer();

    // Schedule periodic checks
    const interval = setInterval(() => {
      void checkServer();
    }, this.config.interval);
    this.intervals.set(server.id, interval);
  }

  private performHealthCheck(server: Server): Promise<boolean> {
    return new Promise((resolve) => {
      const options: http.RequestOptions = {
        hostname: server.host,
        port: server.port,
        path: this.config.path ?? '/health',
        method: 'GET',
        timeout: this.config.timeout,
      };

      const request = http.request(options, (response) => {
        // Consider 2xx status codes as healthy
        const isHealthy = response.statusCode !== undefined && response.statusCode >= 200 && response.statusCode < 300;
        resolve(isHealthy);
      });

      request.on('error', () => {
        resolve(false);
      });

      request.on('timeout', () => {
        request.destroy();
        resolve(false);
      });

      request.end();
    });
  }

  addServer(server: Server): void {
    if (!this.config.enabled) {
      return;
    }

    // Clear any existing interval for this server
    this.removeServer(server.id);

    // Start checking the new server
    this.startCheckingServer(server);
  }

  removeServer(serverId: string): void {
    const interval = this.intervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(serverId);
    }
  }
}
