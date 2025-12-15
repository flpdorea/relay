/**
 * Configuration type definitions for Relay Load Balancer
 */

/**
 * Configuration for a single backend server
 */
export interface ServerConfig {
  id: string;
  host: string;
  port: number;
  weight?: number;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // Interval between checks in ms
  timeout: number; // Timeout for each check in ms
  healthyThreshold: number; // Number of successful checks to mark as healthy
  unhealthyThreshold: number; // Number of failed checks to mark as unhealthy
  path?: string; // HTTP path to check (e.g., "/health")
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
}

/**
 * Load balancing strategy types
 */
export type StrategyType = 'round-robin' | 'least-connections' | 'weighted' | 'random';

/**
 * Main load balancer configuration
 */
export interface LoadBalancerConfig {
  port: number; // Port for the load balancer to listen on
  strategy: StrategyType; // Load balancing strategy
  servers: ServerConfig[]; // Backend servers
  healthCheck: HealthCheckConfig; // Health check settings
  logging: LoggingConfig; // Logging settings
  timeout: number; // Request timeout in ms
}
