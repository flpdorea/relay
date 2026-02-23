import { Server } from '../core/types';

export interface LoadBalancingStrategy {
  readonly name: string;

  selectServer(servers: Server[]): Server | null;

  onRequestStart?(serverId: string): void;

  onRequestComplete?(serverId: string): void;
}
