# Contributing to Kubb plugins

This repository is home to both official and community plugins for [Kubb](https://kubb.dev), the meta framework for code generation. We welcome contributions, and there are a few ways to get involved:

- Found a bug? File it in the [issue tracker](https://github.com/kubb-labs/plugins/issues).
- Have an idea for a plugin or improvement? [Open an issue](https://github.com/kubb-labs/plugins/issues/new) to share it.
- Need help? Ask the community on [Discord](https://discord.gg/4dQjA6vrWX).

Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating. Search the [issue tracker](https://github.com/kubb-labs/plugins/issues) before opening a new issue or PR. For significant changes, open an issue first and wait for maintainer feedback. Small fixes (typos, docs, tests) can go straight to a PR.

## Prerequisites

- Node.js 22 or newer
- pnpm 11 or newer. The repo pins a version in `packageManager`, so the easiest way to match it is `corepack enable` and let Corepack pick the right pnpm
- Git

## Getting started

Fork the repo, then clone your fork and install:

```bash
gh repo fork kubb-labs/plugins --clone   # or: git clone https://github.com/kubb-labs/plugins.git
cd plugins
pnpm install
pnpm build
```

`pnpm build` compiles every plugin with tsdown so the examples and tests resolve local versions.

## The Kubb ecosystem

Kubb spans a few repositories. Knowing where code lives saves time:

- [kubb-labs/kubb](https://github.com/kubb-labs/kubb) is the core. It holds the engine that runs the plugin system, the OpenAPI adapter, the AST and JSX renderer, the CLI, and the MCP server. The plugin APIs you build against live here.
- [kubb-labs/plugins](https://github.com/kubb-labs/plugins) (this repo) holds the official plugins and a runnable example per plugin. Work here on a specific generator or to add a new plugin.

## What is inside this repo

```
plugins/
├── packages/                # The plugins themselves
│   ├── plugin-ts/           # TypeScript types and interfaces
│   ├── plugin-axios/        # Type-safe HTTP client based on axios
│   ├── plugin-fetch/        # Type-safe HTTP client based on the Fetch API
│   ├── plugin-react-query/  # TanStack Query hooks for React
│   ├── plugin-vue-query/    # TanStack Query hooks for Vue
│   ├── plugin-swr/          # SWR hooks
│   ├── plugin-zod/          # Zod schemas
│   ├── plugin-faker/        # Faker mock data
│   ├── plugin-msw/          # MSW handlers
│   ├── plugin-cypress/      # Cypress tests
│   ├── plugin-redoc/        # ReDoc documentation
│   └── plugin-mcp/          # MCP integration
├── internals/               # Shared, non-published helpers
│   ├── client/              # Shared generator builders for the HTTP client plugins
│   ├── shared/              # Shared AST helpers used across packages
│   ├── tanstack-query/      # Shared TanStack Query utilities
│   └── utils/               # General utilities
├── examples/                # A runnable project per plugin
├── tests/                   # End-to-end, performance, and version-specific suites
├── schemas/                 # OpenAPI specs used for testing
├── configs/                 # Shared build and test configuration
└── assets/                  # Static assets
```

Most plugins under `packages/` follow the same shape: `src/plugin.ts` defines the plugin, `src/generators/` holds the generation logic, `src/components/` holds JSX-renderer components, and `src/*.test.ts` holds the tests. A few are leaner, like the client plugins (`plugin-axios`, `plugin-fetch`) that reuse `@internals/client`, and `plugin-redoc`, which is a single `redoc.tsx` with no `generators/` or `components/`.

## Tech stack

| Tool | Purpose |
|------|---------|
| [TypeScript](https://www.typescriptlang.org/) | Language (strict, ESM only) |
| [pnpm](https://pnpm.io/) | Package manager with workspaces |
| [Turborepo](https://turbo.build/) | Monorepo task runner |
| [tsdown](https://github.com/sxzz/tsdown) | Bundler |
| [Vitest](https://vitest.dev/) | Testing |
| [oxlint](https://oxc.rs/docs/guide/usage/linter.html) | Linter |
| [oxfmt](https://github.com/oxc-project/oxfmt) | Formatter |
| [Changesets](https://github.com/changesets/changesets) | Versioning |
| [GitHub Actions](https://github.com/features/actions) | CI/CD |

## Commands

```bash
pnpm build               # Build all plugins
pnpm build:examples      # Build the examples
pnpm generate            # Regenerate every example against local plugins
pnpm test                # Run all tests once
pnpm test:watch          # Run tests in watch mode
pnpm test:bench          # Performance benchmarks
pnpm typecheck           # Type-check the plugins
pnpm typecheck:examples  # Type-check the examples
pnpm lint                # Lint with oxlint
pnpm lint:fix            # Lint and auto-fix
pnpm format              # Format with oxfmt
pnpm changeset           # Create a changeset
```

To run a single plugin's tests:

```bash
pnpm vitest run --config ./configs/vitest.config.ts packages/plugin-ts
pnpm vitest run --config ./configs/vitest.config.ts -u packages/plugin-ts   # update snapshots
```

## Development workflow

1. Create a branch from `main`.
2. Make your change, with tests for new behavior.
3. Build and verify locally with `pnpm build && pnpm typecheck && pnpm test`.
4. Regenerate examples with `pnpm generate` after a plugin change, then fix style with `pnpm format && pnpm lint:fix`.

## Plugin options and docs

A plugin's options are documented in the docs repo ([kubb-labs/docs](https://github.com/kubb-labs/docs)):

- Each plugin has a hand-written page at `plugins/<name>/index.md` whose frontmatter carries the registry metadata (name, category, npm package, maintainers, compatibility). Options live in the body of that page and its `reference/` subpages.
- When a change here adds, removes, or alters an option, update the matching page in the same release cycle. It reaches kubb.dev through the platform fetch pipeline.
- A documented option must exist in the plugin's `src/types.ts` `Options` type and be honored in `src/plugin.ts`. Keep documented defaults in step with the destructuring defaults in `plugin.ts`.

## Adding a plugin

Plugins live under `packages/plugin-<name>/` and follow this layout:

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

After scaffolding, add a runnable example under `examples/`, add tests in `src/`, and open a PR with a changeset.

## Opening a pull request

1. Run the full check locally first, in this order:

   ```bash
   pnpm format && pnpm lint:fix
   pnpm typecheck
   pnpm test
   pnpm generate    # update generated examples after a plugin change
   ```

2. Add a changeset for any change that affects a published package (see below).
3. Commit with [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `perf:`.
4. Push your branch and open a PR against `main`, then fill out the template.

### Changesets

Changesets drive versioning and the changelog. When your change affects a published package, run:

```bash
pnpm changeset
```

Pick the packages you changed, choose the bump (patch for fixes, minor for features, major for breaking changes), and write a short summary aimed at users. Commit the generated file under `.changeset/`. Docs-only or internal changes that touch no published package do not need one.

## Releasing

This section covers what happens after a PR with a changeset merges. Contributors don't need it, but maintainers do.

Merging a changeset into `main` queues or updates the "Version Packages" PR, opened automatically by the release workflow (`.github/workflows/release.yml`). Merging that PR triggers the release job, which stages every changed package with `pnpm stage publish` (npm's staged publishing). A staged package is not installable yet. Nothing becomes public until a maintainer approves it.

To approve a release:

1. A maintainer with npm publish access and two-factor authentication runs `npm stage approve` (or approves from npmjs.com) for each staged package.
2. The same maintainer approves the `promote` job's environment review on the workflow run in the Actions tab.
3. The `promote` job then verifies the versions are actually live on npm, tags the released versions, and creates a GitHub Release, and only then dispatches the content refresh to [kubb-labs/platform](https://github.com/kubb-labs/platform).

Packages in this repo version and changelog independently (see the empty `fixed` and `linked` groups in `.changeset/config.json`), so a release here creates one GitHub Release per staged package, tagged `<package>@<version>`, with notes taken from that package's own `CHANGELOG.md`. This differs from [kubb-labs/kubb](https://github.com/kubb-labs/kubb), where every package shares one fixed version and a release covers all of them combined.

If a staged version turns out to be wrong, reject it with `npm stage reject` instead of approving it. Nothing downstream fires for a rejected version.

Reviewers for the `promote` job's environment are managed on GitHub, under the repository's Settings > Environments > `npm-release-approval` (this is separate from npm's own settings on npmjs.com).

Canary releases are the one exception to this flow. Every push to `main` stamps each package to its own unique `-canary.<timestamp>` version and publishes it under the `canary` dist-tag directly, without staging, so canary installs stay immediate and automatic. See the comment above the `Publish canary` step in `release.yml` for why this is safe to leave unstaged.
