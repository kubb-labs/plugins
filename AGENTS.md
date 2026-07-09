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
`.github/copilot-instructions.md` symlink to it. Skills live in `.agents/skills/` (open
`SKILL.md` format, cross-provider). Always-on conventions live in `.claude/rules/`
(`code-style`, `jsdoc`, `markdown`, `testing`, `security`, `usa-english`), and `.claude/` also holds commands,
subagents, output styles, and hooks.

<skills>

## Skills

You have new skills. If any skill might be relevant then you MUST read it.

- [changelog](.agents/skills/changelog/SKILL.md) - Automatically creates user-facing changelogs from git commits by analyzing commit history, categorizing changes, and transforming technical commits into clear, customer-friendly release notes. Turns hours of manual changelog writing into minutes of automated generation.
- [deslop](.agents/skills/deslop/SKILL.md) - Remove AI-generated code slop from a branch or diff. Use after writing or generating code to strip unnecessary comments, defensive checks, `any` casts, and style that does not match the surrounding file. For prose and markdown, use the humanizer skill instead.
- [documentation](.agents/skills/documentation/SKILL.md) - Use when writing blog posts or documentation markdown files - provides writing style guide (active voice, present tense), content structure patterns, and SEO optimization. Overrides brevity rules for proper grammar.
- [humanizer](.agents/skills/humanizer/SKILL.md) - Remove AI writing patterns to make documentation sound natural, specific, and human. Covers content patterns, language patterns, style patterns, and communication patterns.
- [jsdoc](.agents/skills/jsdoc/SKILL.md) - Full JSDoc format guide for TypeScript, covering @example formats (short, multi-line, multi-variant), tag usage (@default, @deprecated, what to avoid), documentation patterns for properties/enums/functions, and tag order.
- [pr](.agents/skills/pr/SKILL.md) - Rules and checklist for preparing PRs, creating changesets, and releasing packages in the monorepo.
</skills>
