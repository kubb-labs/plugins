# Contributing to Kubb

This repository is home to both official and community plugins for [Kubb](https://kubb.dev), the meta framework for code generation. We welcome contributions, and there are a few ways to get involved:

- Found a bug? File it in the [issue tracker](https://github.com/kubb-labs/plugins/issues).
- Have an idea for a plugin or improvement? [Open an issue](https://github.com/kubb-labs/plugins/issues/new) to share it.
- Need help? Ask the community on [Discord](https://discord.gg/4dQjA6vrWX).

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

## Before you start

* Search the [issue tracker](https://github.com/kubb-labs/plugins/issues) before opening a new issue or PR.
* For significant changes, open an issue first and wait for maintainer feedback.
* Small fixes (typos, docs, tests) can go straight to a PR.

## Tech stack

| Tool | Purpose |
|------|---------|
| [Node.js](https://nodejs.org/) ≥ 22 | Runtime |
| [pnpm](https://pnpm.io/) ≥ 11 | Package manager |
| [Turborepo](https://turbo.build/) | Monorepo task runner |
| [TypeScript](https://www.typescriptlang.org/) | Language (strict, ESM-only) |
| [tsdown](https://github.com/sxzz/tsdown) | Bundler |
| [Vitest](https://vitest.dev/) | Testing |
| [oxlint](https://oxc.rs/docs/guide/usage/linter) | Linter |
| [oxfmt](https://github.com/nicolo-ribaudo/oxfmt) | Formatter |
| [Changesets](https://github.com/changesets/changesets) | Versioning |

## Setup

```bash
gh repo fork kubb-labs/plugins --clone
cd plugins
pnpm install
pnpm build
```

## Commands

```bash
pnpm build          # Build all packages
pnpm generate       # Run all examples against local packages
pnpm test           # Run all tests
pnpm test:watch     # Watch mode
pnpm test:bench     # Performance benchmarks
pnpm format         # Format code
pnpm lint:fix       # Lint and auto-fix
pnpm typecheck      # Type check all packages
pnpm lint:spell     # Spell check .ts and .md files
pnpm changeset      # Create a changeset for versioning
```

To run tests for a single package:

```bash
pnpm vitest run --config ./configs/vitest.config.ts packages/plugin-ts
# Update snapshots
pnpm vitest run --config ./configs/vitest.config.ts -u packages/plugin-ts
```

## Project structure

```
.
├── packages/                # Plugin implementations
│   ├── plugin-ts/           # TypeScript type generation
│   ├── plugin-client/       # Client generator (fetch, axios, etc.)
│   ├── plugin-faker/        # Faker.js mock data generation
│   ├── plugin-zod/          # Zod schema generation
│   ├── plugin-msw/          # MSW mock handlers
│   ├── plugin-react-query/  # React Query/TanStack Query hooks
│   ├── plugin-vue-query/    # Vue Query hooks
│   ├── plugin-cypress/      # Cypress test generation
│   ├── plugin-redoc/        # ReDoc documentation
│   └── plugin-mcp/          # MCP (Model Context Protocol) integration
├── internals/               # Shared internal utilities
│   ├── tanstack-query/      # Shared TanStack Query utilities
│   └── utils/               # General utilities
├── examples/                # Example projects demonstrating plugins
├── tests/                   # Test suites (e2e, performance, version-specific)
├── plugins/                 # YAML plugin configurations
├── schemas/                 # OpenAPI schema definitions
├── docs/                    # Documentation
├── configs/                 # Shared configurations
├── assets/                  # Static assets
└── .github/                 # GitHub workflows & templates
```

## Pull request checklist

Run checks in this order before opening a PR:

```bash
pnpm format && pnpm lint:fix
pnpm typecheck
pnpm test
pnpm generate    # update generated examples after plugin changes
pnpm changeset   # required if you changed any published package
```

* Target the `main` branch.
* Fill out the PR template completely.
* Include a changeset for every code change that affects a published package.

Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages: `feat:`, `fix:`, `docs:`, `chore:`, etc.

## Adding a plugin

Plugins live under `packages/plugin-<name>/`. Each plugin follows this layout:

```
packages/plugin-<name>/
├── src/
│   ├── index.ts        # Public API
│   ├── plugin.ts       # Plugin definition
│   ├── components/     # JSX components
│   ├── generators/     # Code generation logic
│   └── *.test.ts(x)    # Unit tests
├── package.json
├── tsconfig.json       # extends ../../tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

After scaffolding:

1. Add a runnable example under `examples/`.
2. Add tests in `src/`.
3. Open a PR with a changeset.
