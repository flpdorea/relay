import { LoadBalancingStrategy } from './types.js';
import { RoundRobin } from './RoundRobin.js';
import { LeastConnections } from './LeastConnections.js';
import { Weighted } from './Weighted.js';
import { Random } from './Random.js';
import { StrategyType } from '../config/types.js';
import { ConfigValidationError } from '../config/ConfigLoader.js';

export class StrategyFactory {
  static createStrategy(type: StrategyType): LoadBalancingStrategy {
    switch (type) {
      case 'round-robin':
        return new RoundRobin();
      case 'least-connections':
        return new LeastConnections();
      case 'weighted':
        return new Weighted();
      case 'random':
        return new Random();
      default:
        throw new ConfigValidationError(`Unknown strategy type: ${type as string}`);
    }
  }
}
