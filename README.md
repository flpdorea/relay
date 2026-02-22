# Relay

A TypeScript HTTP load balancer with pluggable strategies and health checks.

[![codecov](https://codecov.io/gh/flpdorea/relay/branch/master/graph/badge.svg)](https://codecov.io/gh/flpdorea/relay)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [License](#license)

## Features

- **Load Balancing Strategies**: Round-robin (implemented), with stubs for least-connections, weighted, and random
- **Health Checks**: HTTP-based health monitoring with configurable intervals and thresholds
- **Server Pool Management**: Connection tracking, failure/success counters, dynamic server management
- **Structured Logging**: Text or JSON format with configurable log levels
- **Graceful Shutdown**: SIGTERM/SIGINT handling with active request draining
- **Request Timeouts**: Configurable timeouts with automatic fallback

## Installation

```bash
npm install
npm run build
```

Requires Node.js >= 24.12.0

## Usage

```bash
# Start the load balancer
npm start -- --config config/config.json

# Development mode
npm run dev -- --config config/config.json
```

### Test Servers

```bash
# Start multiple test backends
npm run test-server -- --port 3001
npm run test-server -- --port 3002
npm run test-server -- --port 3003
```

## Configuration

Configuration is JSON-based. See `config/config.example.json`:

```json
{
  "port": 3000,
  "strategy": "round-robin",
  "timeout": 30000,
  "servers": [
    {
      "id": "server-1",
      "host": "localhost",
      "port": 3001,
      "weight": 1
    }
  ],
  "healthCheck": {
    "enabled": true,
    "interval": 5000,
    "timeout": 3000,
    "healthyThreshold": 2,
    "unhealthyThreshold": 3,
    "path": "/health"
  },
  "logging": {
    "level": "info",
    "format": "text"
  }
}
```

### Configuration Options

| Field                            | Type    | Description                         |
| -------------------------------- | ------- | ----------------------------------- |
| `port`                           | number  | Load balancer listen port           |
| `strategy`                       | string  | Load balancing algorithm            |
| `timeout`                        | number  | Request timeout in milliseconds     |
| `servers`                        | array   | Backend server definitions          |
| `healthCheck.enabled`            | boolean | Enable/disable health checks        |
| `healthCheck.interval`           | number  | Health check interval in ms         |
| `healthCheck.timeout`            | number  | Health check timeout in ms          |
| `healthCheck.healthyThreshold`   | number  | Successes required to mark healthy  |
| `healthCheck.unhealthyThreshold` | number  | Failures required to mark unhealthy |
| `healthCheck.path`               | string  | HTTP path for health checks         |
| `logging.level`                  | string  | Log level: debug, info, warn, error |
| `logging.format`                 | string  | Output format: text or json         |

## Architecture

```
CLI Interface
    |
Core Load Balancer
    ├── Request Router (pluggable strategies)
    ├── Health Check Manager
    ├── Server Pool Manager
    ├── Request Logger
    └── Metrics Collector
    |
HTTP Server (incoming requests)
    |
Backend Servers
```

### Key Components

- **ServerPool**: Manages backend state, connection tracking, health status
- **HealthChecker**: Periodic HTTP health checks with threshold-based state transitions
- **Strategies**: Load balancing algorithm implementations
- **Logger**: Structured logging with metadata support

## Development

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run typecheck
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Test coverage target: 90%+

## License

MIT
