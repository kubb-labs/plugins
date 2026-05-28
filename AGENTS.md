# AGENTS.md

Kubb is a plugin-based code-generation toolkit for generating TypeScript, React-Query, Zod, Faker.js, MSW and more from OpenAPI specifications.

## High-Level Architecture

This repository contains the plugin ecosystem for Kubb, organized around:

- **Plugin System** - Modular code generators (TypeScript, Client, React-Query, Vue-Query, Zod, Faker, MSW, Cypress, ReDoc, MCP)
- **Shared Utilities** - Common tools and helpers used across plugins
- **Configuration Management** - YAML-based plugin configuration system
- **Testing & Examples** - Comprehensive test suites and working examples

## Directory Organization

The monorepo is structured as follows:

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

## Plugin Ecosystem

### Plugin Packages

Each plugin in the `packages/` directory follows a consistent structure:

- `src/components/` - JSX-renderer components
- `src/generators/` - Generator implementations
- `src/*.test.ts` - Tests
- `package.json` - Plugin metadata

### Shared Utilities

The `internals/` directory provides shared utilities:

- **tanstack-query** - Shared TanStack Query utilities
- **utils** - General utility functions

### Plugin Configurations

The `plugins/` directory contains YAML configuration files for each plugin, with shared templates in `_shared/`. These files document every plugin option (name, type, default, description, examples) and feed the plugin reference pages on [kubb.dev](https://kubb.dev).

> [!IMPORTANT]
> **Editing plugin docs/options metadata — edit the source, not the generated file.**
>
> - **Source of truth:** `plugins/<name>.yaml` plus the shared option fragments in `plugins/_shared/**`. A source file may pull in shared fragments with `extends: ./_shared/...`.
> - **Generated output:** `packages/<name>/extension.yaml` is produced by `scripts/build-extension-yaml.ts`, which resolves every `extends:` into a self-contained file. **Never edit `packages/*/extension.yaml` by hand** — your changes are overwritten on the next build.
> - **Regenerate** after editing any source: `pnpm build:extension-yaml`. Commit both the source and the regenerated `packages/*/extension.yaml`.
> - **Shared fragments are global:** changing a file under `plugins/_shared/` updates every plugin that `extends` it. Override per-plugin by adding fields next to the `extends:` (they are deep-merged on top of the shared fragment).
> - **Exception:** `plugin-swr` has no source file in `plugins/` and is not part of the build script, so its `packages/plugin-swr/extension.yaml` is hand-maintained — edit it directly until a `plugins/plugin-swr.yaml` source is added.
> - **Keep docs in sync with code:** an option only belongs in the YAML if it exists in that plugin's `src/types.ts` `Options` type and is honored in `src/plugin.ts`. Match documented `default:` values to the destructuring defaults in `plugin.ts`.

### Examples & Tests

- **Examples** - Working example projects for each plugin (fetch, TypeScript, React-Query, Vue-Query, Zod, MSW, Faker, Cypress, custom generators)
- **Tests** - E2E tests, performance tests, and version-specific test suites
- **Schemas** - OpenAPI schema definitions for testing

## Repository Setup

- **Monorepo** - Uses pnpm workspaces and Turborepo
- **Module system** - ESM-only (`type: "module"`)
- **Node version** - 22
- **Versioning** - Changesets
- **CI/CD** - GitHub Actions

## Commands

```bash
pnpm install                 # Install dependencies
pnpm clean                   # Clean build artifacts
pnpm build                   # Build all packages
pnpm generate                # Generate code from OpenAPI specs
pnpm perf                    # Run performance tests
pnpm test                    # Run tests
pnpm typecheck               # Type check all packages
pnpm typecheck:examples      # Type check examples
pnpm format                  # Format code
pnpm lint                    # Lint code
pnpm lint:fix                # Lint and fix issues
pnpm changeset               # Create changelog entry
pnpm run upgrade && pnpm i   # Upgrade dependencies
```

<skills>

## Skills

You have new skills. If any skill might be relevant then you MUST read it.

- [changelog](.skills/changelog/SKILL.md) - Automatically creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical commits into clear, customer-friendly release notes. Turns hours of manual changelog writing into minutes of automated generation.
- [coding-style](.skills/coding-style/SKILL.md) - Coding style, testing, and PR guidelines. Use when writing or reviewing code.
- [documentation](.skills/documentation/SKILL.md) - Use when writing blog posts or documentation markdown files - provides writing style guide (active voice, present tense), content structure patterns, and SEO optimization. Overrides brevity rules for proper grammar.
- [jsdoc](.skills/jsdoc/SKILL.md) - Guidelines for writing minimal, high-quality JSDoc comments in TypeScript.
- [pr](.skills/pr/SKILL.md) - Rules and checklist for preparing PRs, creating changesets, and releasing packages in the monorepo.
- [testing](.skills/testing/SKILL.md) - Testing, CI, and troubleshooting guidance for running the repository's test suite and interpreting CI failures.
</skills>
