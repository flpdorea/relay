import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RequestRouter } from '../../../src/core/RequestRouter';
import { ServerPool } from '../../../src/core/ServerPool';
import { LoadBalancingStrategy } from '../../../src/strategies/types';
import { Server, ServerConfig } from '../../../src/core/types';

class MockStrategy implements LoadBalancingStrategy {
  name = 'mock';
  private index = 0;

  selectServer(servers: Server[]): Server | null {
    if (servers.length === 0) return null;
    const server = servers[this.index % servers.length];
    this.index++;
    return server;
  }
}

describe('RequestRouter', () => {
  let serverPool: ServerPool;
  let strategy: MockStrategy;
  let router: RequestRouter;

  const serverConfigs: ServerConfig[] = [
    { id: 'server-1', host: 'localhost', port: 3001 },
    { id: 'server-2', host: 'localhost', port: 3002 },
  ];

  beforeEach(() => {
    serverPool = new ServerPool(serverConfigs);
    strategy = new MockStrategy();
    router = new RequestRouter(serverPool, strategy);
  });

  describe('getServer', () => {
    it('should return server from strategy selection', () => {
      const server = router.getServer();
      expect(server).not.toBeNull();
      expect(['server-1', 'server-2']).toContain(server?.id);
    });

    it('should return null when no healthy servers', () => {
      serverPool.setHealthStatus('server-1', false);
      serverPool.setHealthStatus('server-2', false);

      const server = router.getServer();
      expect(server).toBeNull();
    });

    it('should only pass healthy servers to strategy', () => {
      serverPool.setHealthStatus('server-1', false);

      const server = router.getServer();
      expect(server?.id).toBe('server-2');
    });
  });

  describe('connection tracking', () => {
    it('should track active connections when request starts', () => {
      router.startRequest('server-1');
      expect(serverPool.getStats('server-1')?.activeConnections).toBe(1);

      router.startRequest('server-1');
      expect(serverPool.getStats('server-1')?.activeConnections).toBe(2);
    });

    it('should decrement active connections when request completes', () => {
      router.startRequest('server-1');
      router.startRequest('server-1');
      expect(serverPool.getStats('server-1')?.activeConnections).toBe(2);

      router.completeRequest('server-1');
      expect(serverPool.getStats('server-1')?.activeConnections).toBe(1);

      router.completeRequest('server-1');
      expect(serverPool.getStats('server-1')?.activeConnections).toBe(0);
    });

    it('should not decrement below zero', () => {
      router.completeRequest('server-1');
      expect(serverPool.getStats('server-1')?.activeConnections).toBe(0);
    });
  });

  describe('strategy callbacks', () => {
    it('should call onRequestStart if defined', () => {
      const mockStart = jest.fn();
      strategy.onRequestStart = mockStart;

      router.startRequest('server-1');
      expect(mockStart).toHaveBeenCalledWith('server-1');
    });

    it('should call onRequestComplete if defined', () => {
      const mockComplete = jest.fn();
      strategy.onRequestComplete = mockComplete;

      router.completeRequest('server-1');
      expect(mockComplete).toHaveBeenCalledWith('server-1');
    });

    it('should not fail if callbacks are undefined', () => {
      expect(() => router.startRequest('server-1')).not.toThrow();
      expect(() => router.completeRequest('server-1')).not.toThrow();
    });
  });
});
