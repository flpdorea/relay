import { ServerPool } from './ServerPool';
import { LoadBalancingStrategy } from '../strategies/types';
import { Server } from './types';

export class RequestRouter {
  constructor(
    private serverPool: ServerPool,
    private strategy: LoadBalancingStrategy
  ) {}

  getServer(): Server | null {
    const healthyServers = this.serverPool.getHealthy();
    return this.strategy.selectServer(healthyServers);
  }

  startRequest(serverId: string): void {
    this.serverPool.markRequestStart(serverId);
    this.strategy.onRequestStart?.(serverId);
  }

  completeRequest(serverId: string): void {
    this.serverPool.markRequestComplete(serverId, true);
    this.strategy.onRequestComplete?.(serverId);
  }
}
