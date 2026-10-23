# AGENTS.md

Kubb is a plugin-based code-generation toolkit for generating TypeScript, React-Query, Zod, Faker.js, MSW and more from OpenAPI specifications.

## High-level architecture

This repository contains the plugin ecosystem for Kubb, organized around:

- Plugin system: modular code generators (TypeScript, Client, React-Query, Vue-Query, Zod, Faker, MSW, Cypress, ReDoc, MCP)
- Shared utilities and helpers used across plugins
- Test suites and working examples

## Project structure and commands

The full folder structure, repository setup, and commands live in
[CONTRIBUTING.md](CONTRIBUTING.md).

## Repository setup

| Aspect | Choice |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Module system | ESM-only (`type: "module"`) |
| Node version | 22 |
| Package manager | pnpm 11+ |
| Linter | oxlint |
| Formatter | oxfmt |
| Bundler | tsdown |
| Tests | Vitest |
| Versioning | Changesets |
| CI/CD | GitHub Actions |

## Plugin ecosystem

### Plugin packages

Each plugin in the `packages/` directory follows a consistent structure:

- `src/components/` - JSX-renderer components
- `src/generators/` - Generator implementations
- `src/*.test.ts` - Tests
- `docs/` - kubb.dev pages (overview, options, guides)
- `kubb-extension.json` - Registry metadata
- `package.json` - Plugin metadata

### Shared utilities

The `internals/` directory provides shared utilities:

- `tanstack-query` holds shared TanStack Query utilities
- `utils` holds general utility functions

### Plugin docs and metadata

Each plugin ships its docs in `packages/<name>/docs/`. The registry reads the folder from the npm tarball, and [kubb.dev](https://kubb.dev) renders it at `https://kubb.dev/extensions/kubb-labs/<name>`.

- `docs/overview.md` (required): a short lead on what the plugin does, then `## Setup`, `## Options worth knowing`, and `## Example` with `kubb.config.ts`. No `## See also` and no install commands, because kubb.dev adds the install steps and the dependency list to the page.
- `docs/options.md`: every option.
- `docs/guides/<id>.md`: one how-to guide per file, in file name order.
- Every file starts with a `# Title` line and a one-paragraph description. Use no frontmatter or raw HTML, and write links as absolute `https://kubb.dev/...` URLs.
- Registry metadata (display name, category, icon, maintainers, dependencies, compatibility) lives in `kubb-extension.json`.

> [!IMPORTANT]
> **Changing a plugin's options? Update `packages/<name>/docs/options.md` in the same PR.**
>
> A documented option must exist in the plugin's `src/types.ts` `Options` type and be honored in `src/plugin.ts`. Keep the documented defaults matching the destructuring defaults in `plugin.ts`.

### Examples and tests

- Examples are working projects for each plugin (fetch, TypeScript, React-Query, Vue-Query, Zod, MSW, Faker, Cypress, custom generators)
- Tests cover e2e, performance, and version-specific suites
- Schemas are OpenAPI definitions for testing

## How agents read this repo

`AGENTS.md` is the canonical instruction file. Local skills live in `.agents/skills/` (open
`SKILL.md` format, cross-provider). Shared skills, convention rules, `/create-pr`,
`/create-changeset`, `/create-branch`, `/create-issue`, the `code-reviewer` subagent, and the
`house` output style come from the `agents` plugin
([stijnvanhulle/agents](https://github.com/stijnvanhulle/agents)). Claude Code loads it from
this repo's `.claude/settings.json`. Install `agents@stijnvanhulle` for Cursor and Codex.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
