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
- `package.json` - Plugin metadata

### Shared utilities

The `internals/` directory provides shared utilities:

- `tanstack-query` holds shared TanStack Query utilities
- `utils` holds general utility functions

### Plugin docs and metadata

Plugin docs live in the docs repo ([kubb-labs/docs](https://github.com/kubb-labs/docs)). Each plugin is a single hand-written page at `plugins/<name>.md` whose frontmatter carries the registry metadata (name, category, npm package, maintainers, compatibility), published on [kubb.dev](https://kubb.dev).

> [!IMPORTANT]
> **Changing a plugin's options? Update its kubb.dev page in the docs repo.**
>
> A documented option must exist in the plugin's `src/types.ts` `Options` type and be honored in `src/plugin.ts`. Keep the documented defaults matching the destructuring defaults in `plugin.ts`.

### Examples and tests

- Examples are working projects for each plugin (fetch, TypeScript, React-Query, Vue-Query, Zod, MSW, Faker, Cypress, custom generators)
- Tests cover e2e, performance, and version-specific suites
- Schemas are OpenAPI definitions for testing

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
`.github/copilot-instructions.md` symlink to it. Local skills live in `.agents/skills/` (open
`SKILL.md` format, cross-provider). Always-on conventions live in `.claude/rules/`
(`code-style`, `jsdoc`, `markdown`, `plain-language`, `testing`, `security`, `usa-english`),
and `.claude/` also holds commands, subagents, output styles, and hooks.

Shared skills come from [stijnvanhulle/agents](https://github.com/stijnvanhulle/agents).
Install the `agents` plugin (`agents@stijnvanhulle`) for Claude Code, Cursor, and Codex.

- [ask](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/ask/SKILL.md) - Ask a blocking multiple-choice question with the client's native picker, or a lettered list when none exists.
- [backlog](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/backlog/SKILL.md) - Triage recent GitHub, ClickUp, or Jira issues, then implement confirmed ones in isolated worktrees.
- [branch](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/branch/SKILL.md) - Name and create a Conventional Commit branch from a GitHub, ClickUp, or Jira issue.
- [changelog](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/changelog/SKILL.md) - Turn commit history and changesets into user-facing release notes.
- [changeset](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/changeset/SKILL.md) - Write or review a release-note changeset with the correct bump.
- [conventions](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/conventions/SKILL.md) - Apply the shared TypeScript, markdown, testing, security, and language rules.
- [deslop](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/deslop/SKILL.md) - Audit a diff for over-engineering and AI code/prose tells, then apply only confirmed fixes.
- [documentation](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/documentation/SKILL.md) - Write or review developer documentation using the project style and SEO guidance.
- [humanizer](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/humanizer/SKILL.md) - Find AI writing tells and apply only confirmed rewrites.
- [issue](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/issue/SKILL.md) - Create or triage a GitHub or Jira issue with its type, labels, and fields filled.
- [jsdoc](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/jsdoc/SKILL.md) - Apply the TypeScript JSDoc format, examples, tags, and ordering.
- [pr](https://github.com/stijnvanhulle/agents/blob/main/.agents/skills/pr/SKILL.md) - Prepare, open, update, or assess a pull request, including checks, changesets, title, template, and CI.

<skills>

## Skills

</skills>
