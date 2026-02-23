import { LoadBalancingStrategy } from './types';
import { Server } from '../core/types';

export class Random implements LoadBalancingStrategy {
  readonly name = 'random';

  selectServer(servers: Server[]): Server | null {
    // TODO: Implement actual random selection
    // For now, return first available server
    return servers[0] ?? null;
  }
}
