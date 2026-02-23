import { LoadBalancingStrategy } from './types';
import { Server } from '../core/types';

export class RoundRobin implements LoadBalancingStrategy {
  readonly name = 'round-robin';
  private currentIndex = 0;

  selectServer(servers: Server[]): Server | null {
    if (servers.length === 0) {
      return null;
    }

    const server = servers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % servers.length;
    return server ?? null;
  }
}
