export interface ServerConfig {
  id: string;
  host: string;
  port: number;
  weight?: number;
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
  path?: string;
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
}

export type StrategyType = 'round-robin' | 'least-connections' | 'weighted' | 'random';

export interface LoadBalancerConfig {
  port: number;
  strategy: StrategyType;
  servers: ServerConfig[];
  healthCheck: HealthCheckConfig;
  logging: LoggingConfig;
  timeout: number; // Request timeout in ms
}
