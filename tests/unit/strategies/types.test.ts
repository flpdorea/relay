import { LoadBalancingStrategy } from '../../../src/strategies/types';
import { Server } from '../../../src/core/types';

describe('LoadBalancingStrategy interface', () => {
  it('should be implementable with required members', () => {
    const mockStrategy: LoadBalancingStrategy = {
      name: 'mock',
      selectServer: (servers: Server[]) => servers[0] ?? null,
    };

    expect(mockStrategy.name).toBe('mock');
    expect(typeof mockStrategy.selectServer).toBe('function');
  });

  it('should support optional callbacks', () => {
    const mockStrategy: LoadBalancingStrategy = {
      name: 'mock',
      selectServer: (servers: Server[]) => servers[0] ?? null,
      onRequestStart: (serverId: string) => {},
      onRequestComplete: (serverId: string) => {},
    };

    expect(typeof mockStrategy.onRequestStart).toBe('function');
    expect(typeof mockStrategy.onRequestComplete).toBe('function');
  });
});
