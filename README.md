<div align="center">
  <h1>Kubb Plugins</h1>
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo">
  </a>

  <p>Official plugins for <a href="https://kubb.dev">Kubb</a> - Generate type-safe SDKs from OpenAPI specifications.</p>

[![License][license-src]][license-href]
</div>

## Overview

This monorepo contains all official Kubb plugins for code generation from OpenAPI specifications. It follows the same monorepo structure used in the main [kubb-labs/kubb](https://github.com/kubb-labs/kubb) repository.

## Packages

Kubb v5 OpenAPI configs use [`@kubb/adapter-oas`](https://www.npmjs.com/package/@kubb/adapter-oas) as the adapter layer.

### TypeScript

| Package | Version | Description |
|---------|---------|-------------|
| [`@kubb/plugin-ts`](./packages/plugin-ts) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-ts.svg)](https://www.npmjs.com/package/@kubb/plugin-ts) | TypeScript types and interfaces generation |

### Clients

| Package | Version | Description |
|---------|---------|-------------|
| [`@kubb/plugin-client`](./packages/plugin-client) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-client.svg)](https://www.npmjs.com/package/@kubb/plugin-client) | API client generation (Axios, Fetch) |

### Zod

| Package | Version | Description |
|---------|---------|-------------|
| [`@kubb/plugin-zod`](./packages/plugin-zod) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-zod.svg)](https://www.npmjs.com/package/@kubb/plugin-zod) | Zod schema generation for runtime validation |

### Data Fetching

| Package | Version | Description |
|---------|---------|-------------|
| [`@kubb/plugin-react-query`](./packages/plugin-react-query) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-react-query.svg)](https://www.npmjs.com/package/@kubb/plugin-react-query) | TanStack Query hooks for React |
| [`@kubb/plugin-vue-query`](./packages/plugin-vue-query) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-vue-query.svg)](https://www.npmjs.com/package/@kubb/plugin-vue-query) | TanStack Query composables for Vue |

### Testing & Mocking

| Package | Version | Description |
|---------|---------|-------------|
| [`@kubb/plugin-faker`](./packages/plugin-faker) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-faker.svg)](https://www.npmjs.com/package/@kubb/plugin-faker) | Faker.js mock data generation |
| [`@kubb/plugin-msw`](./packages/plugin-msw) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-msw.svg)](https://www.npmjs.com/package/@kubb/plugin-msw) | Mock Service Worker handlers |
| [`@kubb/plugin-cypress`](./packages/plugin-cypress) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-cypress.svg)](https://www.npmjs.com/package/@kubb/plugin-cypress) | Cypress e2e test generation |

### Documentation & AI

| Package | Version | Description |
|---------|---------|-------------|
| [`@kubb/plugin-redoc`](./packages/plugin-redoc) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-redoc.svg)](https://www.npmjs.com/package/@kubb/plugin-redoc) | ReDoc API documentation generation |
| [`@kubb/plugin-mcp`](./packages/plugin-mcp) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-mcp.svg)](https://www.npmjs.com/package/@kubb/plugin-mcp) | Model Context Protocol tools for AI assistants |

## Examples

| Example | Description |
|---------|-------------|
| [`typescript`](./examples/typescript) | Generate TypeScript types |
| [`client`](./examples/client) | Generate API clients with Axios |
| [`fetch`](./examples/fetch) | Generate API clients with Fetch |
| [`zod`](./examples/zod) | Generate Zod validation schemas |
| [`react-query`](./examples/react-query) | Generate React Query hooks |
| [`vue-query`](./examples/vue-query) | Generate Vue Query composables |
| [`faker`](./examples/faker) | Generate Faker.js mock data |
| [`msw`](./examples/msw) | Generate MSW handlers |
| [`cypress`](./examples/cypress) | Generate Cypress tests |
| [`mcp`](./examples/mcp) | Generate MCP tools |
| [`advanced`](./examples/advanced) | Advanced multi-plugin configuration |

## Monorepo Structure

```
plugins/
├── packages/              # Kubb plugins
│   ├── plugin-ts/         # TypeScript generation
│   ├── plugin-client/     # API client generation
│   ├── plugin-zod/        # Zod schemas
│   ├── plugin-react-query/# React Query hooks
│   ├── plugin-vue-query/  # Vue Query composables
│   ├── plugin-faker/      # Faker.js mocks
│   ├── plugin-msw/        # MSW handlers
│   ├── plugin-cypress/    # Cypress tests
│   ├── plugin-redoc/      # ReDoc documentation
│   └── plugin-mcp/        # MCP integration
├── internals/             # Shared internal utilities (not published)
│   ├── utils/             # @internals/utils
│   └── tanstack-query/    # @internals/tanstack-query
├── examples/              # Usage examples
└── tests/                 # Performance and e2e tests
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 10

### Install

```bash
pnpm install
```

### Build

```bash
# Build all packages
pnpm build

# Build examples
pnpm build:examples
```

### Test

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch
```

### Typecheck

```bash
pnpm typecheck
```

## Contributing

Want to contribute to a plugin or add a new one? Here's how:

1. **Create your package** under `packages/` following the existing plugin layout:
   ```
   packages/
   └── plugin-your-name/
       ├── src/
       │   ├── index.ts
       │   ├── plugin.ts
       │   └── generators/
       ├── package.json
       ├── tsconfig.json
       ├── tsdown.config.ts
       └── vitest.config.ts
   ```

2. **Use the same tooling conventions**:
   - `tsdown` for building
   - `vitest` for testing
   - `oxlint` for linting/formatting
   - Extend `../../tsconfig.json` in your `tsconfig.json`

3. **Add an example** under `examples/` that demonstrates your plugin.

4. **Open a pull request** with your changes.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

## License

[MIT](./LICENSE) © [Stijn Van Hulle](https://github.com/stijnvanhulle)

[license-src]: https://img.shields.io/github/license/kubb-labs/plugins.svg
[license-href]: https://github.com/kubb-labs/plugins/blob/main/LICENSE
