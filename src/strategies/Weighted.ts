import { LoadBalancingStrategy } from './types';
import { Server } from '../core/types';

export class Weighted implements LoadBalancingStrategy {
  readonly name = 'weighted';

  selectServer(servers: Server[]): Server | null {
    // TODO: Implement actual weighted algorithm
    // For now, return first available server
    return servers[0] ?? null;
  }
}
