export interface Server {
  id: string;
  host: string;
  port: number;
  weight?: number;
  healthy: boolean;
  activeConnections: number;
  failureCount: number;
  successCount: number;
}

export interface ServerConfig {
  id: string;
  host: string;
  port: number;
  weight?: number;
}

export interface LoadBalancerConfig {
  port: number;
  strategy: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  servers: ServerConfig[];
  healthCheck: HealthCheckConfig;
  logging: LoggingConfig;
  timeout: number; // Request timeout in ms
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number; // ms
  timeout: number; // ms
  healthyThreshold: number;
  unhealthyThreshold: number;
  path?: string; // HTTP path to check
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
}

export interface RequestMetadata {
  method: string;
  path: string;
  serverId: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
}
