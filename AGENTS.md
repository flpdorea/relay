# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Project Overview

Relay is a TypeScript HTTP load balancer with pluggable strategies and health checks.

## Build/Lint/Test Commands

### Build

```bash
npm run build        # Compile TypeScript to dist/
npm run typecheck    # Type check without emitting
```

### Lint & Format

```bash
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run format       # Format with Prettier
npm run format:check # Check formatting
```

### Test

```bash
npm test                           # Run all tests
npm run test:watch                 # Watch mode
npm run test:coverage              # Run with coverage report
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/unit/core/ServerPool.test.ts  # Run single test file
node --experimental-vm-modules node_modules/jest/bin/jest.js --testNamePattern="should add"      # Run tests matching pattern
```

## Code Style

### TypeScript Configuration

- Target: ES2022 with ES modules (`"type": "module"` in package.json)
- Strict mode enabled with all strict flags
- `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUncheckedIndexedAccess`
- Requires Node.js >= 24.12.0

### Formatting (Prettier)

- Semi-colons: required
- Quotes: single quotes
- Print width: 120
- Tab width: 2 spaces
- Trailing commas: ES5
- Arrow parens: always
- End of line: LF

### Naming Conventions

- **Classes**: PascalCase (`ServerPool`, `HealthChecker`, `ConfigLoader`)
- **Interfaces**: PascalCase with `I` prefix for service interfaces (`ILogger`), plain PascalCase for data interfaces (`Server`, `ServerConfig`)
- **Types**: PascalCase (`LogLevel`, `StrategyType`)
- **Variables/functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE for global constants (`LOG_LEVEL_PRIORITY`), camelCase for local
- **Files**: PascalCase for classes (`ServerPool.ts`), camelCase for utilities
- **Private members**: no prefix, access with `this.`

### Import Style

```typescript
import { Server, ServerConfig } from './types';
import { ServerPool } from './ServerPool';
import * as fs from 'fs';
import * as http from 'http';
```

- Group imports: external modules first, then internal modules
- Use named imports for specific items
- Use `import * as` for Node.js built-in modules
- Use `.js` extension in imports for ES module resolution: `'./types'` works, but path mappings use `'./types'` without extension

### Type Annotations

- Explicit return types required for exported functions/methods (ESLint warns)
- Use union types and literal types for restricted values:
  ```typescript
  type StrategyType = 'round-robin' | 'least-connections' | 'weighted' | 'random';
  type LogLevel = 'debug' | 'info' | 'warn' | 'error';
  ```
- Prefer `interface` for object shapes, `type` for unions and utility types
- Use `Record<string, unknown>` for dynamic objects
- Avoid `any` - use `unknown` and type guards instead
- Use optional properties (`weight?: number`) for optional config fields

### Error Handling

- Throw specific error classes extending `Error`:
  ```typescript
  export class ConfigValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ConfigValidationError';
    }
  }
  ```
- Use descriptive error messages with context
- Catch and re-throw with additional context when needed
- Handle promise rejections explicitly with `void` for fire-and-forget:
  ```typescript
  void checkServer(); // Explicitly ignoring promise
  ```
- Use `(error as Error).message` pattern in catch blocks

### Async/Promises

- Use `async/await` for asynchronous code
- Return `Promise<T>` for async functions
- Use `void` prefix for intentionally unhandled promises:
  ```typescript
  const interval = setInterval(() => {
    void checkServer();
  }, this.config.interval);
  ```

### Class Structure

```typescript
export class Example {
  private field: string;

  constructor(private dependency: IDependency) {
    this.field = 'value';
  }

  public method(): ReturnType {
    // implementation
  }

  private helperMethod(): void {
    // implementation
  }
}
```

### Null/Undefined Handling

- Use `undefined` for optional values (not `null`)
- Use optional chaining: `obj?.property`
- Use nullish coalescing: `value ?? defaultValue`
- Check for existence before access:
  ```typescript
  const server = this.servers.get(id);
  if (server) {
    server.healthy = true;
  }
  ```

### Testing Patterns

- Use Jest with `describe`/`it` blocks
- Use `beforeEach` for setup
- Group related tests in nested `describe` blocks
- Test file naming: `*.test.ts`
- Import from relative paths: `import { ServerPool } from '../../../src/core/ServerPool';`
- Use `expect().toBe()`, `expect().toEqual()`, `expect().toThrow()` assertions

### Documentation

- Use JSDoc comments for public APIs (optional but encouraged)
- Include parameter descriptions and return types
- Document complex algorithms or non-obvious logic

## Project Structure

```
src/
  core/       # Core business logic (ServerPool, HealthChecker, types)
  config/     # Configuration loading and validation
  logger/     # Logging infrastructure
  strategies/ # Load balancing strategy implementations
  cli/        # CLI entry point
tests/
  unit/       # Unit tests mirroring src/ structure
  integration/# Integration tests
```

## Key Principles

1. **Strict TypeScript**: No `any`, explicit returns, strict null checks
2. **Dependency Injection**: Pass dependencies via constructor
3. **Interface Segregation**: Small, focused interfaces
4. **Error Transparency**: Throw meaningful errors with context
5. **Test Coverage**: Maintain 90%+ coverage threshold
