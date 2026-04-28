# Contributing to Kubb

Thank you for your interest in contributing to Kubb! We welcome contributions of all kinds — bug fixes, new features, documentation improvements, and more. This guide will help you get started quickly.

Before contributing, please read our [Code of Conduct](./CODE_OF_CONDUCT.md). We expect all contributors to follow it in every community space.

## Table of Contents

- [Before You Start](#before-you-start)
- [Tech Stack](#tech-stack)
- [Setting Up Your Environment](#setting-up-your-environment)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Linting, Formatting & Type Checking](#linting-formatting--type-checking)
- [Changesets & Versioning](#changesets--versioning)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Creating a New Plugin](#creating-a-new-plugin)

---

## Before You Start

To avoid wasted effort, please:

1. Search the [issue tracker](https://github.com/kubb-labs/plugins/issues) to check whether the bug or feature has already been reported or discussed.
2. For significant changes, [open an issue](https://github.com/kubb-labs/plugins/issues/new) first to describe the problem or proposal. Wait for maintainer feedback before writing code.
3. For small fixes (typos, documentation, tests), you can open a pull request directly.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [Node.js](https://nodejs.org/) ≥ 22 | JavaScript runtime |
| [pnpm](https://pnpm.io/) ≥ 10 | Package manager and workspace orchestration |
| [Turborepo](https://turbo.build/) | Monorepo task runner and caching |
| [TypeScript](https://www.typescriptlang.org/) | Language (strict, ESM-only) |
| [tsdown](https://github.com/sxzz/tsdown) | Package bundler |
| [Vitest](https://vitest.dev/) | Unit and benchmark testing |
| [oxlint](https://oxc.rs/docs/guide/usage/linter) | Fast JavaScript/TypeScript linter |
| [oxfmt](https://github.com/nicolo-ribaudo/oxfmt) | Code formatter |
| [CSpell](https://cspell.org/) | Spell checker for code and docs |
| [Changesets](https://github.com/changesets/changesets) | Versioning and changelog management |

---

## Setting Up Your Environment

_The commands below assume you have the [GitHub CLI](https://github.com/cli/cli#installation) installed. You can also use the GitHub web UI if you prefer._

### 1. Fork and clone the repository

```bash
gh repo fork kubb-labs/plugins --clone
cd plugins
```

Or clone your fork manually:

```bash
git clone https://github.com/<your-github-name>/plugins.git
cd plugins
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Build all packages

```bash
pnpm build
```

---

## Project Structure

```
plugins/
├── packages/           # Published Kubb plugins
│   ├── plugin-ts/      # TypeScript type generation
│   ├── plugin-client/  # API client generation (Axios, Fetch)
│   ├── plugin-zod/     # Zod schema generation
│   ├── plugin-faker/   # Faker.js mock data
│   ├── plugin-msw/     # Mock Service Worker handlers
│   ├── plugin-react-query/  # TanStack Query hooks for React
│   ├── plugin-vue-query/    # TanStack Query composables for Vue
│   ├── plugin-svelte-query/ # TanStack Query stores for Svelte
│   ├── plugin-solid-query/  # TanStack Query primitives for Solid
│   ├── plugin-swr/     # SWR hooks
│   ├── plugin-cypress/ # Cypress e2e test generation
│   ├── plugin-redoc/   # ReDoc documentation generation
│   └── plugin-mcp/     # Model Context Protocol integration
├── internals/          # Shared internal utilities (not published)
│   ├── utils/          # @internals/utils
│   └── tanstack-query/ # @internals/tanstack-query
├── examples/           # Runnable usage examples
├── tests/              # Performance benchmarks and e2e tests
│   └── performance/    # Vitest benchmarks
└── configs/            # Shared Vitest and tooling configuration
```

Each plugin follows the same internal layout:

```
packages/plugin-<name>/
├── src/
│   ├── index.ts            # Public API
│   ├── plugin.ts           # Plugin definition
│   ├── components/         # React-fabric JSX components
│   ├── generators/         # Code generation logic
│   └── *.test.ts(x)        # Unit tests
├── package.json
├── tsconfig.json
├── tsdown.config.ts
└── vitest.config.ts
```

---

## Development Workflow

### Build

```bash
# Build all packages
pnpm build

# Build a single package (e.g. plugin-ts)
pnpm turbo run build --filter=@kubb/plugin-ts
```

### Generate examples

```bash
pnpm generate
```

This runs all examples against the local packages and auto-fixes + formats the output.

### Watch mode

```bash
pnpm test:watch
```

---

## Testing

Tests live alongside source files in `src/` and use the `.test.ts` or `.test.tsx` extension.

### Run all tests

```bash
pnpm test
```

### Run tests for a specific package

```bash
pnpm vitest run --config ./configs/vitest.config.ts packages/plugin-ts
```

### Update snapshots

```bash
pnpm vitest run --config ./configs/vitest.config.ts -u packages/plugin-ts
```

### Performance benchmarks

Benchmarks live in `tests/performance/` and measure code generation speed across plugin combinations. Run them before and after changes that touch core generation logic.

```bash
pnpm test:bench
```

See [tests/performance/README.md](tests/performance/README.md) for details on understanding results and adding new benchmarks.

---

## Linting, Formatting & Type Checking

Run these checks locally before opening a pull request. The order matters: **format → lint → typecheck → test**.

```bash
# Format code (oxfmt)
pnpm format

# Lint code (oxlint) and auto-fix where possible
pnpm lint:fix

# Type check all packages
pnpm typecheck

# Spell check .ts and .md files (CSpell)
pnpm lint:spell
```

> [!TIP]
> If you add a new technical term, library name, or proper noun that CSpell flags, add it to the `words` array in `cspell.json`.

---

## Changesets & Versioning

This repository uses [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs. Every pull request that changes published package code must include a changeset.

### Create a changeset

```bash
pnpm changeset
```

The interactive CLI will ask you to:

1. Select the packages you changed.
2. Choose the semver bump type (`major` / `minor` / `patch`).
3. Write a short summary of the change (this appears in the changelog).

A new file is created in `.changeset/`. Commit this file with your changes.

### Commit convention

Use [Conventional Commits](https://www.conventionalcommits.org/) for your commit messages:

```bash
git add <file>
git commit -m "feat(plugin-ts): add support for discriminated union types"
git commit -m "fix(plugin-zod): correct optional field handling"
git commit -m "docs: update CONTRIBUTING guide"
git commit -m "chore: upgrade vitest to v4"
```

The title format for commits in this repo is `[<plugin-name>] <description>` or a conventional commit prefix.

---

## Submitting a Pull Request

1. Ensure all checks pass locally:

   ```bash
   pnpm format && pnpm lint:fix
   pnpm typecheck
   pnpm test
   ```

2. Create a changeset if you changed any published package:

   ```bash
   pnpm changeset
   ```

3. Push your branch and open a pull request against the `main` branch.

4. Fill out the pull request template completely.

5. Request a review from the maintainers.

> [!IMPORTANT]
> All pull requests must target the `main` branch.

---

## Creating a New Plugin

1. Create your package under `packages/plugin-<name>/` following the existing plugin layout shown in [Project Structure](#project-structure).

2. Follow the same tooling conventions:
   - `tsdown` for building
   - `vitest` for testing
   - `oxlint` + `oxfmt` for linting and formatting
   - Extend `../../tsconfig.json` in your `tsconfig.json`
   - Export a typed plugin factory function as the public API

3. Add a runnable example under `examples/` that demonstrates your plugin with a real OpenAPI spec.

4. Add tests in `src/` covering the generators and components.

5. Open a pull request with a changeset describing the new plugin.

---

## Credits

This guide was inspired by the contributing guidelines for [create-t3-app](https://github.com/t3-oss/create-t3-app/blob/next/CONTRIBUTING.md).
