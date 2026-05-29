# AGENTS.md

Kubb is a plugin-based code-generation toolkit for generating TypeScript, React-Query, Zod, Faker.js, MSW and more from OpenAPI specifications.

## High-Level Architecture

This repository contains the plugin ecosystem for Kubb, organized around:

- Plugin system: modular code generators (TypeScript, Client, React-Query, Vue-Query, Zod, Faker, MSW, Cypress, ReDoc, MCP)
- Shared utilities and helpers used across plugins
- YAML based plugin configuration
- Test suites and working examples

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

- `tanstack-query` holds shared TanStack Query utilities
- `utils` holds general utility functions

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

- Examples are working projects for each plugin (fetch, TypeScript, React-Query, Vue-Query, Zod, MSW, Faker, Cypress, custom generators)
- Tests cover e2e, performance, and version-specific suites
- Schemas are OpenAPI definitions for testing

## Repository Setup

| Aspect | Choice |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Module system | ESM-only (`type: "module"`) |
| Node version | 22 |
| Package manager | pnpm 11+ |
| Linter | oxlint |
| Formatter | oxfmt |
| Tests | Vitest |
| Versioning | Changesets |
| CI/CD | GitHub Actions |

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

## Token optimized CLI (rtk)

`rtk` is a CLI proxy that filters and compresses command output to cut token usage. Prefix shell
commands with it so their output stays small:

```bash
rtk git status
rtk git log -10
rtk pnpm test
```

Run these meta commands directly:

```bash
rtk gain              # Token savings dashboard
rtk gain --history    # Per-command savings history
rtk discover          # Find missed rtk opportunities
rtk proxy <cmd>       # Run raw without filtering but still track usage
```

## How agents read this repo

`AGENTS.md` is the canonical instruction file. `CLAUDE.md`, `GEMINI.md`, and
`.github/copilot-instructions.md` symlink to it. Skills live in `.agents/skills/` (open
`SKILL.md` format, cross-provider). Always-on conventions live in `.claude/rules/`
(`code-style`, `jsdoc`, `markdown`, `testing`, `security`), and `.claude/` also holds commands,
subagents, output styles, and hooks.

<skills>

## Skills

You have new skills. If any skill might be relevant then you MUST read it.

- [changelog](.agents/skills/changelog/SKILL.md) - Creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical commits into clear, customer-friendly release notes.
- [documentation](.agents/skills/documentation/SKILL.md) - Use when writing blog posts or documentation markdown files - provides writing style guide (active voice, present tense), content structure patterns, and SEO optimization. Overrides brevity rules for proper grammar.
- [humanizer](.agents/skills/humanizer/SKILL.md) - Remove AI writing patterns to make documentation sound natural, specific, and human. Covers content patterns, language patterns, style patterns, and communication patterns.
- [jsdoc](.agents/skills/jsdoc/SKILL.md) - Full JSDoc format guide for TypeScript, covering @example formats, tag usage (@default, @deprecated, what to avoid), documentation patterns for properties/enums/functions, and tag order.
- [pr](.agents/skills/pr/SKILL.md) - Rules and checklist for preparing PRs, creating changesets, and releasing packages in the monorepo.
- [spec-driven](.agents/skills/spec-driven/SKILL.md) - Drive a spec-driven workflow for a larger feature: specify requirements and acceptance criteria, research decisions, plan numbered slices, implement, then verify. Use for multi-step features that need a reviewable paper trail. Skip it for small, obvious changes.
</skills>
