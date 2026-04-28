# Contribution Guidelines

When contributing to `Kubb`, whether on GitHub or in other community spaces:

- Be respectful, civil, and open-minded.
- Before opening a new pull request, try searching through the [issue tracker](https://github.com/kubb-labs/kubb/issues) for known issues or fixes.
- If you want to make code changes based on your personal opinion(s), make sure you open an issue first describing the changes you want to make, and open a pull request only when your suggestions get approved by maintainers.

## How to Contribute

### Prerequisites

In order to not waste your time implementing a change that has already been declined, or is generally not needed, start by [opening an issue](https://github.com/kubb-labs/kubb/issues/new) describing the problem you would like to solve.

### Set Up Your Environment Locally

_Some commands will assume you have the GitHub CLI installed, if you haven't, consider [installing it](https://github.com/cli/cli#installation), but you can always use the Web UI if you prefer that instead._

In order to contribute to this project, you will need to fork the repository:

```bash
gh repo fork kubb-labs/plugins
```

then, clone it to your local machine:

```bash
gh repo clone <your-github-name>/plugins
```

Install dependencies (Node.js >= 22 and pnpm >= 10 are required):

```bash
pnpm install
```

Build all packages so workspace dependencies are available:

```bash
pnpm build
```

### Plugin Architecture

Kubb plugins are composed of three main pieces:

**1. Plugin factory** (`src/plugin.ts`)

Every plugin is created with `definePlugin` from `@kubb/core`. It receives user options, sets resolved options on the context, registers a resolver, and adds one or more generators.

```ts
import { definePlugin } from '@kubb/core'
import type { PluginExample } from './types.ts'

export const pluginExample = definePlugin<PluginExample>((options) => {
  return {
    name: 'plugin-example',
    options,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({ /* resolved options */ })
        ctx.setResolver(myResolver)
        ctx.addGenerator(myGenerator)
      },
    },
  }
})
```

**2. Generator** (`src/generators/`)

Generators are created with `defineGenerator` from `@kubb/core`. Each generator implements `schema` and/or `operation` methods that return JSX rendered by `@kubb/renderer-jsx`. The JSX `<File>` component writes the output files.

```ts
import { defineGenerator } from '@kubb/core'
import { File, jsxRenderer } from '@kubb/renderer-jsx'
import type { PluginExample } from '../types.ts'

export const myGenerator = defineGenerator<PluginExample>({
  name: 'example',
  renderer: jsxRenderer,
  schema(node, ctx) {
    // Return JSX describing the file to write, or undefined to skip
    return (
      <File baseName="example.ts" path={...}>
        {/* file content as JSX */}
      </File>
    )
  },
  operation(node, ctx) {
    // Same pattern for operation-level generation
  },
})
```

**3. Resolver** (`src/resolvers/`)

Resolvers are created with `defineResolver` from `@kubb/core`. They control how names and file paths are derived from schema/operation nodes. Extend the base `Resolver` type for your plugin-specific helpers.

```ts
import { defineResolver } from '@kubb/core'
import type { PluginExample } from '../types.ts'

export const myResolver = defineResolver<PluginExample>((ctx) => ({
  name: 'default',
  pluginName: 'plugin-example',
  default(name, type) {
    return camelCase(name)
  },
  // add custom resolve helpers here
}))
```

**4. Types** (`src/types.ts`)

Define your `Options`, `ResolvedOptions`, and the `PluginFactoryOptions` type alias. Register the plugin in the global `Kubb.PluginRegistry` namespace.

```ts
import type { PluginFactoryOptions, Resolver } from '@kubb/core'

export type Options = { output?: Output; /* ... */ }
type ResolvedOptions = { output: Output; /* ... */ }
export type PluginExample = PluginFactoryOptions<'plugin-example', Options, ResolvedOptions, Resolver>

declare global {
  namespace Kubb {
    interface PluginRegistry {
      'plugin-example': PluginExample
    }
  }
}
```

### Creating a New Plugin

Follow these steps to add a new plugin to the monorepo.

**1. Scaffold the package**

Create a directory under `packages/` that mirrors the existing layout:

```
packages/
└── plugin-your-name/
    ├── src/
    │   ├── components/      # JSX components for code rendering
    │   ├── generators/      # defineGenerator implementations
    │   ├── resolvers/       # defineResolver implementation
    │   ├── index.ts         # public re-exports
    │   ├── plugin.ts        # definePlugin factory
    │   └── types.ts         # Options, ResolvedOptions, PluginFactoryOptions
    ├── package.json
    ├── tsconfig.json
    ├── tsdown.config.ts
    └── vitest.config.ts
```

**2. Configure the package**

Copy `package.json`, `tsconfig.json`, `tsdown.config.ts`, and `vitest.config.ts` from an existing plugin (such as `packages/plugin-ts`) and adjust the `name` field and any relevant dependencies.

Key conventions:
- Set `"type": "module"` and `"sideEffects": false` in `package.json`.
- Extend `../../tsconfig.json` in your `tsconfig.json`.
- Use `tsdown` for building (ESM + CJS dual output with `.d.ts` declarations).
- Use `vitest` for testing.
- Use `oxlint` for linting.

In `tsdown.config.ts`, never bundle `@kubb/*` packages — use `neverBundle: [/^@kubb\//]`. Use `alwaysBundle: [/@internals/]` for internal workspace utilities.

**3. Implement the plugin**

- `src/types.ts` — define `Options`, `ResolvedOptions`, `PluginFactoryOptions`, and register in `Kubb.PluginRegistry`.
- `src/resolvers/` — implement a resolver with `defineResolver`.
- `src/generators/` — implement one or more generators with `defineGenerator`.
- `src/plugin.ts` — wire everything together with `definePlugin`.
- `src/index.ts` — re-export the public API.

**4. Add an example**

Create a directory under `examples/` that demonstrates your plugin with a real `kubb.config.ts` and a sample OpenAPI spec.

**5. Create a changeset**

```bash
pnpm run changeset
```

Follow the CLI prompts to select your new package and write a user-facing description of the change.

### Implement Your Changes

This project includes several code quality tools to help maintain code standards:

- **Linting**: Run `pnpm run lint` to check code style (uses oxlint)
- **Formatting**: Run `pnpm run format` to auto-format code
- **Type checking**: Run `pnpm run typecheck` to verify TypeScript types
- **Spell checking**: Run `pnpm run lint:spell` to check spelling in `.ts` and `.md` files (uses CSpell)
- **Testing**: Run `pnpm run test` to run the test suite
- **Performance benchmarks**: Run `pnpm run test:bench` to run performance benchmarks

Run checks in this order before committing: **format → lint → typecheck → test**.

#### Spell Checking

This project uses [CSpell](https://cspell.org/) to catch spelling errors in code and documentation. The configuration is in `cspell.json` and uses American English.

If you encounter a spelling error:
- For typos: Fix the spelling in your code.
- For technical terms, library names, or contributor names: Add them to the `words` array in `cspell.json`.

Common technical terms, framework names, and contributor names are already in the dictionary.

#### Performance Testing

Performance benchmarks are located in `tests/performance/` and test the code generation speed of various plugin combinations. These benchmarks help ensure performance does not regress over time.

To run benchmarks:
```bash
pnpm run test:bench
```

When making changes that might affect generation performance (e.g., changes to core build process, plugin generators, or file processing), consider running the benchmarks before and after your changes to verify there are no significant regressions.

See [tests/performance/README.md](tests/performance/README.md) for more details on adding new benchmarks.

When making commits, make sure to follow the [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) guidelines, i.e. prepending the message with `feat:`, `fix:`, `chore:`, `docs:`, etc. You can use `git status` to double check which files have not yet been staged for commit:

```bash
git add <file> && git commit -m "feat/fix/chore/docs: commit message"
```

Next to [conventional commit](https://www.conventionalcommits.org/en/v1.0.0/) we also use [changesets](https://github.com/changesets/changesets). Run the following command and follow the steps in the CLI. You will be prompted to select the changed packages, select if the changes are major/minor/patch, and write a message that will appear in the generated changelog.

```bash
pnpm run changeset
```

### When You're Done

When all that's done, it's time to file a pull request to upstream:

**NOTE**: All pull requests should target the `main` branch.

## Credits

This document was inspired by the contributing guidelines for [create-t3-app](https://github.com/t3-oss/create-t3-app/blob/next/CONTRIBUTING.md).
