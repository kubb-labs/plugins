<div align="center">
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img src="https://kubb.dev/og.png" alt="Kubb banner">
  </a>

[![License][license-src]][license-href]

  <h4>
    <a href="https://kubb.dev" target="_blank">Documentation</a>
    <span> · </span>
    <a href="https://github.com/kubb-labs/plugins/issues/" target="_blank">Report Bug</a>
    <span> · </span>
    <a href="https://github.com/kubb-labs/plugins/issues/" target="_blank">Request Feature</a>
  </h4>
</div>

<br />

# Kubb Plugins

**Official and community plugins for [Kubb](https://kubb.dev).**

## About

This monorepo is home to official and community plugins for [Kubb](https://kubb.dev), the meta framework for code generation. Point Kubb at your OpenAPI specification and it generates TypeScript types, API clients, Zod schemas, React/Vue/Svelte/Solid Query hooks, Faker mocks, MSW handlers, and more.

Want to build your own plugin? See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Official plugins

Maintained by the Kubb team. Kubb v5 OpenAPI configs use [`@kubb/adapter-oas`](https://www.npmjs.com/package/@kubb/adapter-oas) as the adapter layer.

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

### Data fetching

| Package | Version | Description |
|---------|---------|-------------|
| [`@kubb/plugin-react-query`](./packages/plugin-react-query) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-react-query.svg)](https://www.npmjs.com/package/@kubb/plugin-react-query) | TanStack Query hooks for React |
| [`@kubb/plugin-vue-query`](./packages/plugin-vue-query) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-vue-query.svg)](https://www.npmjs.com/package/@kubb/plugin-vue-query) | TanStack Query composables for Vue |

### Testing and mocking

| Package | Version | Description |
|---------|---------|-------------|
| [`@kubb/plugin-faker`](./packages/plugin-faker) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-faker.svg)](https://www.npmjs.com/package/@kubb/plugin-faker) | Faker.js mock data generation |
| [`@kubb/plugin-msw`](./packages/plugin-msw) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-msw.svg)](https://www.npmjs.com/package/@kubb/plugin-msw) | Mock Service Worker handlers |
| [`@kubb/plugin-cypress`](./packages/plugin-cypress) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-cypress.svg)](https://www.npmjs.com/package/@kubb/plugin-cypress) | Cypress e2e test generation |

### Documentation and AI

| Package | Version | Description |
|---------|---------|-------------|
| [`@kubb/plugin-redoc`](./packages/plugin-redoc) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-redoc.svg)](https://www.npmjs.com/package/@kubb/plugin-redoc) | ReDoc API documentation generation |
| [`@kubb/plugin-mcp`](./packages/plugin-mcp) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-mcp.svg)](https://www.npmjs.com/package/@kubb/plugin-mcp) | Model Context Protocol tools for AI assistants |

## Community plugins

Plugins built and maintained by the community. Want to add yours? See [CONTRIBUTING.md](./CONTRIBUTING.md).

> No community plugins listed yet. Be the first to [contribute one](./CONTRIBUTING.md#adding-a-plugin).

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

## Contributing

We welcome contributions, and there are a few ways to get involved:

- Found a bug? File it in the [issue tracker](https://github.com/kubb-labs/plugins/issues).
- Have an idea for a plugin or improvement? [Open an issue](https://github.com/kubb-labs/plugins/issues/new) to share it.
- Need help? Ask the community on [Discord](https://discord.gg/4dQjA6vrWX).

Want to contribute to an existing plugin or add a new one, official or community? See [CONTRIBUTING.md](./CONTRIBUTING.md) for the project structure, prerequisites, local setup, and commands.

## License

[MIT](./LICENSE) © [Stijn Van Hulle](https://github.com/stijnvanhulle)

[license-src]: https://img.shields.io/github/license/kubb-labs/plugins.svg
[license-href]: https://github.com/kubb-labs/plugins/blob/main/LICENSE
