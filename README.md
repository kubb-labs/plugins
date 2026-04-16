<div align="center">
  <h1>Kubb Community Plugins</h1>
  <a href="https://kubb.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://raw.githubusercontent.com/kubb-labs/kubb/main/assets/logo.png" alt="Kubb logo">
  </a>

  <p>A community-driven monorepo of <a href="https://kubb.dev">Kubb</a> plugins.</p>

[![License][license-src]][license-href]
</div>

## Overview

This monorepo is the community home for Kubb plugins. It follows the same monorepo structure used in the main [kubb-labs/kubb](https://github.com/kubb-labs/kubb) repository, but focuses on community-contributed plugins.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@kubb/plugin-ts`](./packages/plugin-ts) | [![npm version](https://img.shields.io/npm/v/@kubb/plugin-ts.svg)](https://www.npmjs.com/package/@kubb/plugin-ts) | TypeScript type generation plugin |

## Examples

| Example | Description |
|---------|-------------|
| [`typescript`](./examples/typescript) | Generate TypeScript types from an OpenAPI spec using `@kubb/plugin-ts` |

## Monorepo Structure

```
plugins/
├── packages/          # Community plugins
│   └── plugin-ts/     # @kubb/plugin-ts
├── internals/         # Shared internal utilities (not published)
│   └── utils/         # @internals/utils
├── examples/          # Usage examples
│   └── typescript/    # TypeScript example
└── configs/           # Shared tooling configs (vitest, mocks)
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

## Contributing a New Plugin

Want to add a plugin to this monorepo? Here's how:

1. **Create your package** under `packages/` following the existing `plugin-ts` layout:
   ```
   packages/
   └── plugin-your-name/
       ├── src/
       │   └── index.ts
       ├── package.json
       ├── tsconfig.json
       ├── tsdown.config.ts
       └── vitest.config.ts
   ```

2. **Use the same tooling conventions** as `plugin-ts`:
  - `tsdown` for building
  - `vitest` for testing
  - `biome` for linting/formatting
  - Extend `../../tsconfig.json` in your `tsconfig.json`

3. **Add an example** under `examples/` that demonstrates your plugin.

4. **Open a pull request** with your changes.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full details.

## License

[MIT](./LICENSE) © [Stijn Van Hulle](https://github.com/stijnvanhulle)

[license-src]: https://img.shields.io/github/license/kubb-labs/plugins.svg
[license-href]: https://github.com/kubb-labs/plugins/blob/main/LICENSE
