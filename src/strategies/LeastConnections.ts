import { LoadBalancingStrategy } from './types';
import { Server } from '../core/types';

export class LeastConnections implements LoadBalancingStrategy {
  readonly name = 'least-connections';

  selectServer(servers: Server[]): Server | null {
    // TODO: Implement actual least-connections algorithm
    // For now, return first available server
    return servers[0] ?? null;
  }
}
