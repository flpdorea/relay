import { RoundRobin } from '../../../src/strategies/RoundRobin';
import { Server } from '../../../src/core/types';

describe('RoundRobin', () => {
  let strategy: RoundRobin;

  beforeEach(() => {
    strategy = new RoundRobin();
  });

  describe('selectServer', () => {
    it('should cycle through servers in order', () => {
      const servers: Server[] = [
        {
          id: 'server-1',
          host: 'localhost',
          port: 3001,
          healthy: true,
          activeConnections: 0,
          failureCount: 0,
          successCount: 0,
        },
        {
          id: 'server-2',
          host: 'localhost',
          port: 3002,
          healthy: true,
          activeConnections: 0,
          failureCount: 0,
          successCount: 0,
        },
        {
          id: 'server-3',
          host: 'localhost',
          port: 3003,
          healthy: true,
          activeConnections: 0,
          failureCount: 0,
          successCount: 0,
        },
      ];

      expect(strategy.selectServer(servers)?.id).toBe('server-1');
      expect(strategy.selectServer(servers)?.id).toBe('server-2');
      expect(strategy.selectServer(servers)?.id).toBe('server-3');
      expect(strategy.selectServer(servers)?.id).toBe('server-1'); // Cycle back
    });

    it('should return null for empty array', () => {
      expect(strategy.selectServer([])).toBeNull();
    });

    it('should always return same server with single server', () => {
      const servers: Server[] = [
        {
          id: 'server-1',
          host: 'localhost',
          port: 3001,
          healthy: true,
          activeConnections: 0,
          failureCount: 0,
          successCount: 0,
        },
      ];

      expect(strategy.selectServer(servers)?.id).toBe('server-1');
      expect(strategy.selectServer(servers)?.id).toBe('server-1');
      expect(strategy.selectServer(servers)?.id).toBe('server-1');
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(strategy.name).toBe('round-robin');
    });
  });
});
