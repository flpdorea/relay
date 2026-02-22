import { Server, ServerConfig } from './types';

export class ServerPool {
  private servers: Map<string, Server>;

  constructor(serverConfigs: ServerConfig[]) {
    this.servers = new Map();
    this.initializeServers(serverConfigs);
  }

  private initializeServers(serverConfigs: ServerConfig[]): void {
    for (const config of serverConfigs) {
      const server: Server = {
        id: config.id,
        host: config.host,
        port: config.port,
        weight: config.weight ?? 1,
        healthy: true,
        activeConnections: 0,
        failureCount: 0,
        successCount: 0,
      };
      this.servers.set(config.id, server);
    }
  }

  getAll(): Server[] {
    return Array.from(this.servers.values());
  }

  getHealthy(): Server[] {
    return this.getAll().filter((server) => server.healthy);
  }

  getServer(id: string): Server | undefined {
    return this.servers.get(id);
  }

  setHealthStatus(id: string, healthy: boolean): void {
    const server = this.servers.get(id);
    if (server) {
      server.healthy = healthy;
    }
  }

  markRequestStart(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.activeConnections++;
    }
  }

  markRequestComplete(serverId: string, success: boolean): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.activeConnections = Math.max(0, server.activeConnections - 1);
      if (success) {
        server.successCount++;
      } else {
        server.failureCount++;
      }
    }
  }

  incrementFailure(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.failureCount++;
    }
  }

  incrementSuccess(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.successCount++;
    }
  }

  resetFailureCount(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      server.failureCount = 0;
    }
  }

  getStats(serverId: string): { activeConnections: number; failureCount: number; successCount: number } | null {
    const server = this.servers.get(serverId);
    if (!server) {
      return null;
    }
    return {
      activeConnections: server.activeConnections,
      failureCount: server.failureCount,
      successCount: server.successCount,
    };
  }

  hasHealthyServers(): boolean {
    return this.getHealthy().length > 0;
  }

  addServer(config: ServerConfig): void {
    if (this.servers.has(config.id)) {
      throw new Error(`Server with id "${config.id}" already exists`);
    }

    const server: Server = {
      id: config.id,
      host: config.host,
      port: config.port,
      weight: config.weight ?? 1,
      healthy: true,
      activeConnections: 0,
      failureCount: 0,
      successCount: 0,
    };
    this.servers.set(config.id, server);
  }

  removeServer(serverId: string): boolean {
    return this.servers.delete(serverId);
  }

  getServerCount(): number {
    return this.servers.size;
  }

  getHealthyServerCount(): number {
    return this.getHealthy().length;
  }
}
