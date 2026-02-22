import { ServerPool } from '../../../src/core/ServerPool';
import { ServerConfig } from '../../../src/core/types';

describe('ServerPool', () => {
  let serverPool: ServerPool;
  const mockServerConfigs: ServerConfig[] = [
    { id: 'server-1', host: 'localhost', port: 3001, weight: 1 },
    { id: 'server-2', host: 'localhost', port: 3002, weight: 2 },
    { id: 'server-3', host: 'localhost', port: 3003, weight: 1 },
  ];

  beforeEach(() => {
    serverPool = new ServerPool(mockServerConfigs);
  });

  describe('initialization', () => {
    it('should initialize all servers from config', () => {
      const servers = serverPool.getAll();
      expect(servers).toHaveLength(3);
      expect(servers[0].id).toBe('server-1');
      expect(servers[1].id).toBe('server-2');
      expect(servers[2].id).toBe('server-3');
    });

    it('should set all servers as healthy by default', () => {
      const servers = serverPool.getAll();
      servers.forEach((server) => {
        expect(server.healthy).toBe(true);
      });
    });

    it('should initialize active connections to 0', () => {
      const servers = serverPool.getAll();
      servers.forEach((server) => {
        expect(server.activeConnections).toBe(0);
      });
    });

    it('should initialize failure and success counts to 0', () => {
      const servers = serverPool.getAll();
      servers.forEach((server) => {
        expect(server.failureCount).toBe(0);
        expect(server.successCount).toBe(0);
      });
    });

    it('should use default weight of 1 if not specified', () => {
      const serverWithoutWeight: ServerConfig = {
        id: 'server-no-weight',
        host: 'localhost',
        port: 3004,
      };
      const pool = new ServerPool([serverWithoutWeight]);
      const server = pool.getServer('server-no-weight');
      expect(server?.weight).toBe(1);
    });

    it('should use specified weight if provided', () => {
      const server = serverPool.getServer('server-2');
      expect(server?.weight).toBe(2);
    });
  });

  describe('getAll', () => {
    it('should return all servers in the pool', () => {
      const servers = serverPool.getAll();
      expect(servers).toHaveLength(3);
    });

    it('should return a copy of servers array', () => {
      const servers1 = serverPool.getAll();
      const servers2 = serverPool.getAll();
      expect(servers1).not.toBe(servers2);
    });
  });

  describe('getHealthy', () => {
    it('should return only healthy servers', () => {
      const healthy = serverPool.getHealthy();
      expect(healthy).toHaveLength(3);
      healthy.forEach((server) => {
        expect(server.healthy).toBe(true);
      });
    });

    it('should exclude unhealthy servers', () => {
      serverPool.setHealthStatus('server-1', false);
      const healthy = serverPool.getHealthy();
      expect(healthy).toHaveLength(2);
      expect(healthy.every((s) => s.id !== 'server-1')).toBe(true);
    });

    it('should return empty array when no servers are healthy', () => {
      serverPool.setHealthStatus('server-1', false);
      serverPool.setHealthStatus('server-2', false);
      serverPool.setHealthStatus('server-3', false);
      const healthy = serverPool.getHealthy();
      expect(healthy).toHaveLength(0);
    });
  });

  describe('getServer', () => {
    it('should return server by id', () => {
      const server = serverPool.getServer('server-1');
      expect(server?.id).toBe('server-1');
      expect(server?.host).toBe('localhost');
      expect(server?.port).toBe(3001);
    });

    it('should return undefined for non-existent server', () => {
      const server = serverPool.getServer('non-existent');
      expect(server).toBeUndefined();
    });
  });

  describe('setHealthStatus', () => {
    it('should mark server as unhealthy', () => {
      serverPool.setHealthStatus('server-1', false);
      const server = serverPool.getServer('server-1');
      expect(server?.healthy).toBe(false);
    });

    it('should mark server as healthy', () => {
      serverPool.setHealthStatus('server-1', false);
      serverPool.setHealthStatus('server-1', true);
      const server = serverPool.getServer('server-1');
      expect(server?.healthy).toBe(true);
    });

    it('should not affect other servers', () => {
      serverPool.setHealthStatus('server-1', false);
      const server2 = serverPool.getServer('server-2');
      expect(server2?.healthy).toBe(true);
    });

    it('should silently ignore non-existent server', () => {
      expect(() => {
        serverPool.setHealthStatus('non-existent', false);
      }).not.toThrow();
    });
  });

  describe('markRequestStart', () => {
    it('should increment active connections', () => {
      serverPool.markRequestStart('server-1');
      const server = serverPool.getServer('server-1');
      expect(server?.activeConnections).toBe(1);
    });

    it('should increment multiple times', () => {
      serverPool.markRequestStart('server-1');
      serverPool.markRequestStart('server-1');
      serverPool.markRequestStart('server-1');
      const server = serverPool.getServer('server-1');
      expect(server?.activeConnections).toBe(3);
    });

    it('should not affect other servers', () => {
      serverPool.markRequestStart('server-1');
      const server2 = serverPool.getServer('server-2');
      expect(server2?.activeConnections).toBe(0);
    });

    it('should silently ignore non-existent server', () => {
      expect(() => {
        serverPool.markRequestStart('non-existent');
      }).not.toThrow();
    });
  });

  describe('markRequestComplete', () => {
    beforeEach(() => {
      serverPool.markRequestStart('server-1');
      serverPool.markRequestStart('server-1');
    });

    it('should decrement active connections', () => {
      serverPool.markRequestComplete('server-1', true);
      const server = serverPool.getServer('server-1');
      expect(server?.activeConnections).toBe(1);
    });

    it('should increment success count on success', () => {
      serverPool.markRequestComplete('server-1', true);
      const server = serverPool.getServer('server-1');
      expect(server?.successCount).toBe(1);
    });

    it('should increment failure count on failure', () => {
      serverPool.markRequestComplete('server-1', false);
      const server = serverPool.getServer('server-1');
      expect(server?.failureCount).toBe(1);
    });

    it('should not go below 0 for active connections', () => {
      const pool = new ServerPool([{ id: 'server-1', host: 'localhost', port: 3001 }]);
      pool.markRequestComplete('server-1', true);
      const server = pool.getServer('server-1');
      expect(server?.activeConnections).toBe(0);
    });

    it('should silently ignore non-existent server', () => {
      expect(() => {
        serverPool.markRequestComplete('non-existent', true);
      }).not.toThrow();
    });
  });

  describe('incrementFailure', () => {
    it('should increment failure count', () => {
      serverPool.incrementFailure('server-1');
      let server = serverPool.getServer('server-1');
      expect(server?.failureCount).toBe(1);

      serverPool.incrementFailure('server-1');
      server = serverPool.getServer('server-1');
      expect(server?.failureCount).toBe(2);
    });

    it('should not affect other servers', () => {
      serverPool.incrementFailure('server-1');
      const server2 = serverPool.getServer('server-2');
      expect(server2?.failureCount).toBe(0);
    });

    it('should silently ignore non-existent server', () => {
      expect(() => {
        serverPool.incrementFailure('non-existent');
      }).not.toThrow();
    });
  });

  describe('incrementSuccess', () => {
    it('should increment success count', () => {
      serverPool.incrementSuccess('server-1');
      let server = serverPool.getServer('server-1');
      expect(server?.successCount).toBe(1);

      serverPool.incrementSuccess('server-1');
      server = serverPool.getServer('server-1');
      expect(server?.successCount).toBe(2);
    });

    it('should not affect other servers', () => {
      serverPool.incrementSuccess('server-1');
      const server2 = serverPool.getServer('server-2');
      expect(server2?.successCount).toBe(0);
    });

    it('should silently ignore non-existent server', () => {
      expect(() => {
        serverPool.incrementSuccess('non-existent');
      }).not.toThrow();
    });
  });

  describe('resetFailureCount', () => {
    it('should reset failure count to 0', () => {
      serverPool.incrementFailure('server-1');
      serverPool.incrementFailure('server-1');
      serverPool.resetFailureCount('server-1');
      const server = serverPool.getServer('server-1');
      expect(server?.failureCount).toBe(0);
    });

    it('should not affect success count', () => {
      serverPool.incrementSuccess('server-1');
      serverPool.incrementFailure('server-1');
      serverPool.resetFailureCount('server-1');
      const server = serverPool.getServer('server-1');
      expect(server?.successCount).toBe(1);
      expect(server?.failureCount).toBe(0);
    });

    it('should not affect other servers', () => {
      serverPool.incrementFailure('server-1');
      serverPool.incrementFailure('server-2');
      serverPool.resetFailureCount('server-1');
      const server2 = serverPool.getServer('server-2');
      expect(server2?.failureCount).toBe(1);
    });

    it('should silently ignore non-existent server', () => {
      expect(() => {
        serverPool.resetFailureCount('non-existent');
      }).not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return stats for existing server', () => {
      serverPool.markRequestStart('server-1');
      serverPool.markRequestStart('server-1');
      serverPool.incrementSuccess('server-1');
      serverPool.incrementFailure('server-1');

      const stats = serverPool.getStats('server-1');
      expect(stats).toEqual({
        activeConnections: 2,
        failureCount: 1,
        successCount: 1,
      });
    });

    it('should return null for non-existent server', () => {
      const stats = serverPool.getStats('non-existent');
      expect(stats).toBeNull();
    });
  });

  describe('hasHealthyServers', () => {
    it('should return true when there are healthy servers', () => {
      expect(serverPool.hasHealthyServers()).toBe(true);
    });

    it('should return false when all servers are unhealthy', () => {
      serverPool.setHealthStatus('server-1', false);
      serverPool.setHealthStatus('server-2', false);
      serverPool.setHealthStatus('server-3', false);
      expect(serverPool.hasHealthyServers()).toBe(false);
    });

    it('should return true when at least one server is healthy', () => {
      serverPool.setHealthStatus('server-1', false);
      serverPool.setHealthStatus('server-2', false);
      expect(serverPool.hasHealthyServers()).toBe(true);
    });
  });

  describe('addServer', () => {
    it('should add a new server to the pool', () => {
      const newServer: ServerConfig = {
        id: 'server-4',
        host: 'localhost',
        port: 3004,
      };
      serverPool.addServer(newServer);
      const server = serverPool.getServer('server-4');
      expect(server).toBeDefined();
      expect(server?.id).toBe('server-4');
      expect(server?.port).toBe(3004);
    });

    it('should throw error when adding duplicate server id', () => {
      const duplicateServer: ServerConfig = {
        id: 'server-1',
        host: 'localhost',
        port: 3099,
      };
      expect(() => {
        serverPool.addServer(duplicateServer);
      }).toThrow('Server with id "server-1" already exists');
    });

    it('should initialize new server as healthy', () => {
      const newServer: ServerConfig = {
        id: 'server-4',
        host: 'localhost',
        port: 3004,
      };
      serverPool.addServer(newServer);
      const server = serverPool.getServer('server-4');
      expect(server?.healthy).toBe(true);
    });

    it('should initialize new server with zero connections and metrics', () => {
      const newServer: ServerConfig = {
        id: 'server-4',
        host: 'localhost',
        port: 3004,
      };
      serverPool.addServer(newServer);
      const server = serverPool.getServer('server-4');
      expect(server?.activeConnections).toBe(0);
      expect(server?.failureCount).toBe(0);
      expect(server?.successCount).toBe(0);
    });
  });

  describe('removeServer', () => {
    it('should remove server from pool', () => {
      const removed = serverPool.removeServer('server-1');
      expect(removed).toBe(true);
      expect(serverPool.getServer('server-1')).toBeUndefined();
    });

    it('should return false when removing non-existent server', () => {
      const removed = serverPool.removeServer('non-existent');
      expect(removed).toBe(false);
    });

    it('should not affect other servers', () => {
      serverPool.removeServer('server-1');
      expect(serverPool.getServer('server-2')).toBeDefined();
      expect(serverPool.getServer('server-3')).toBeDefined();
    });
  });

  describe('getServerCount', () => {
    it('should return total number of servers', () => {
      expect(serverPool.getServerCount()).toBe(3);
    });

    it('should update after adding server', () => {
      serverPool.addServer({ id: 'server-4', host: 'localhost', port: 3004 });
      expect(serverPool.getServerCount()).toBe(4);
    });

    it('should update after removing server', () => {
      serverPool.removeServer('server-1');
      expect(serverPool.getServerCount()).toBe(2);
    });
  });

  describe('getHealthyServerCount', () => {
    it('should return count of healthy servers', () => {
      expect(serverPool.getHealthyServerCount()).toBe(3);
    });

    it('should exclude unhealthy servers', () => {
      serverPool.setHealthStatus('server-1', false);
      expect(serverPool.getHealthyServerCount()).toBe(2);
    });

    it('should return 0 when no servers are healthy', () => {
      serverPool.setHealthStatus('server-1', false);
      serverPool.setHealthStatus('server-2', false);
      serverPool.setHealthStatus('server-3', false);
      expect(serverPool.getHealthyServerCount()).toBe(0);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete request lifecycle', () => {
      serverPool.markRequestStart('server-1');
      serverPool.markRequestStart('server-2');

      const stats1Before = serverPool.getStats('server-1');
      expect(stats1Before?.activeConnections).toBe(1);

      serverPool.markRequestComplete('server-1', true);
      serverPool.markRequestComplete('server-2', false);

      const stats1After = serverPool.getStats('server-1');
      const stats2After = serverPool.getStats('server-2');

      expect(stats1After?.activeConnections).toBe(0);
      expect(stats1After?.successCount).toBe(1);
      expect(stats2After?.activeConnections).toBe(0);
      expect(stats2After?.failureCount).toBe(1);
    });

    it('should handle health status changes with active connections', () => {
      serverPool.markRequestStart('server-1');
      serverPool.markRequestStart('server-1');

      serverPool.setHealthStatus('server-1', false);

      const server = serverPool.getServer('server-1');
      expect(server?.healthy).toBe(false);
      expect(server?.activeConnections).toBe(2);
    });

    it('should maintain consistency across multiple operations', () => {
      for (let i = 0; i < 5; i++) {
        serverPool.markRequestStart('server-1');
      }

      for (let i = 0; i < 3; i++) {
        serverPool.markRequestComplete('server-1', true);
      }

      for (let i = 0; i < 2; i++) {
        serverPool.markRequestComplete('server-1', false);
      }

      const server = serverPool.getServer('server-1');
      expect(server?.activeConnections).toBe(0);
      expect(server?.successCount).toBe(3);
      expect(server?.failureCount).toBe(2);
    });
  });
});
