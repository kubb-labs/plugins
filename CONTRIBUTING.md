# Contributing to Kubb Community Plugins

Thank you for your interest in contributing! This repository is the community home for [Kubb](https://kubb.dev) plugins. Whether you're adding a new plugin, fixing a bug, or improving documentation — all contributions are welcome.

## Table of Contents

- [Repository Structure](#repository-structure)
- [Adding a New Plugin](#adding-a-new-plugin)
- [Development Workflow](#development-workflow)
- [Conventions](#conventions)
- [Releasing](#releasing)

---

## Repository Structure

```
plugins/
├── packages/          # Published plugins (one directory per plugin)
│   └── plugin-ts/     # Example: @kubb/plugin-ts
├── internals/         # Shared utilities (not published to npm)
│   └── utils/         # @internals/utils — shared helpers used by plugins
├── examples/          # Runnable examples for each plugin
│   └── typescript/    # Example for @kubb/plugin-ts
└── configs/           # Shared tooling (vitest config, test mocks)
```

## Adding a New Plugin

### 1. Scaffold the package

Create a new directory under `packages/` with the plugin slug (e.g. `plugin-zod`):

```bash
mkdir -p packages/plugin-zod/src
```

### 2. `package.json`

Model it after [`packages/plugin-ts/package.json`](./packages/plugin-ts/package.json). Key points:

```jsonc
{
  "name": "@kubb/plugin-zod",        // must be scoped to @kubb
  "version": "0.0.1",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "tsdown",
    "clean": "npx rimraf ./dist",
    "lint": "bun biome lint .",
    "start": "tsdown --watch",
    "test": "vitest --passWithNoTests",
    "typecheck": "tsc -p ./tsconfig.json --noEmit --emitDeclarationOnly false"
  },
  "dependencies": {
    // pin to the same @kubb/* alpha version used by the other plugins
    "@kubb/ast": "5.0.0-alpha.34",
    "@kubb/core": "5.0.0-alpha.34"
  },
  "devDependencies": {
    "@internals/utils": "workspace:*"
  }
}
```

### 3. `tsconfig.json`

Extend the root config:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@kubb/renderer-jsx",
    "types": ["bun-types", "../../reset.d.ts"]
  },
  "include": ["src/**/*", "./package.json", "./tsdown.config.ts", "./vitest.config.ts"]
}
```

### 4. `tsdown.config.ts`

Copy from [`packages/plugin-ts/tsdown.config.ts`](./packages/plugin-ts/tsdown.config.ts) and adjust the entry point if needed.

### 5. `vitest.config.ts`

```ts
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    dir: './src',
  },
  plugins: [tsconfigPaths()],
})
```

### 6. Write your plugin

- Put source files in `src/`.
- Export your plugin factory from `src/index.ts`.
- Write tests alongside source files (`*.test.ts`).
- Use `import { ... } from '#mocks'` for shared test utilities (see [`configs/mocks.ts`](./configs/mocks.ts)).

### 7. Add an example

Create `examples/<plugin-name>/` with at minimum:

- `package.json` — with `@kubb/<plugin-name>: workspace:*` as a dependency
- `kubb.config.ts` — a Kubb config demonstrating the plugin
- A sample input spec (e.g. `petStore.yaml`)

### 8. Register the package paths in `tsconfig.json` (root)

If your plugin exposes subpath exports (e.g. `@kubb/plugin-zod/components`), add them to the root `tsconfig.json` `paths` map so cross-package resolution works during type checking:

```jsonc
// tsconfig.json (root)
{
  "compilerOptions": {
    "paths": {
      "@kubb/plugin-zod": ["./packages/plugin-zod/src/index.ts"],
      "@kubb/plugin-zod/components": ["./packages/plugin-zod/src/components/index.ts"]
    }
  }
}
```

---

## Development Workflow

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) >= 10

### Setup

```bash
pnpm install
```

### Common commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Watch mode |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm generate` | Run all examples (regenerates output) |

### Working on a single package

Use Turborepo's `--filter` flag:

```bash
# Build only plugin-ts
pnpm turbo run build --filter=./packages/plugin-ts

# Test only plugin-ts
pnpm turbo run test --filter=./packages/plugin-ts
```

---

## Conventions

- **Toolchain**: `tsdown` (build), `vitest` (tests), `biome` (lint/format)
- **Formatting**: 2-space indent, single quotes, no semicolons (enforced by Biome)
- **Commits**: Use conventional commit messages (`feat:`, `fix:`, `chore:`, etc.)
- **Exports**: Every public symbol must be re-exported from `src/index.ts`
- **Tests**: Co-locate test files next to source (`foo.test.ts` beside `foo.ts`); use file snapshots (`toMatchFileSnapshot`) for generated output
- **Snapshots**: File snapshots live in `src/**/__snapshots__/`; they are committed to git

---

## Releasing

Releases are managed with [Changesets](https://github.com/changesets/changesets).

1. **Add a changeset** for your changes:
   ```bash
   pnpm changeset
   ```
2. Follow the interactive prompt to select the package(s) and bump type.
3. Commit the generated changeset file.
4. A maintainer will run `pnpm version` and `pnpm release` to publish.
