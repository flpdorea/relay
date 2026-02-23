import { StrategyFactory } from '../../../src/strategies/StrategyFactory';
import { RoundRobin } from '../../../src/strategies/RoundRobin';
import { LeastConnections } from '../../../src/strategies/LeastConnections';
import { Weighted } from '../../../src/strategies/Weighted';
import { Random } from '../../../src/strategies/Random';
import { ConfigValidationError } from '../../../src/config/ConfigLoader';
import { StrategyType } from '../../../src/config/types';

describe('StrategyFactory', () => {
  describe('createStrategy', () => {
    it('should create RoundRobin for round-robin type', () => {
      const strategy = StrategyFactory.createStrategy('round-robin');
      expect(strategy).toBeInstanceOf(RoundRobin);
      expect(strategy.name).toBe('round-robin');
    });

    it('should create LeastConnections for least-connections type', () => {
      const strategy = StrategyFactory.createStrategy('least-connections');
      expect(strategy).toBeInstanceOf(LeastConnections);
      expect(strategy.name).toBe('least-connections');
    });

    it('should create Weighted for weighted type', () => {
      const strategy = StrategyFactory.createStrategy('weighted');
      expect(strategy).toBeInstanceOf(Weighted);
      expect(strategy.name).toBe('weighted');
    });

    it('should create Random for random type', () => {
      const strategy = StrategyFactory.createStrategy('random');
      expect(strategy).toBeInstanceOf(Random);
      expect(strategy.name).toBe('random');
    });

    it('should throw ConfigValidationError for invalid strategy type', () => {
      expect(() => {
        StrategyFactory.createStrategy('invalid-strategy' as StrategyType);
      }).toThrow(ConfigValidationError);
    });

    it('should include strategy type in error message', () => {
      expect(() => {
        StrategyFactory.createStrategy('invalid-strategy' as StrategyType);
      }).toThrow(/invalid-strategy/);
    });

    it('should return new instances on each call', () => {
      const strategy1 = StrategyFactory.createStrategy('round-robin');
      const strategy2 = StrategyFactory.createStrategy('round-robin');
      expect(strategy1).not.toBe(strategy2);
    });
  });
});
