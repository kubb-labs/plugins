# Plan: Fix barrel duplicate identifier collision in multi-plugin output

## Problem

When `barrelType: 'named'` is set at the top-level `output` in a kubb config that uses **multiple plugins** (e.g. `plugin-client`, `plugin-react-query`, `plugin-cypress`, `plugin-msw`, `plugin-faker`, `plugin-mcp`), the generated root `index.ts` barrel aggregates exports from every plugin's output directory. This causes TypeScript `TS2300: Duplicate identifier` errors because multiple plugins export bindings with the same name.

### Example

In `examples/advanced`, the root `src/gen/index.ts` contains:

```ts
export { getAddFilesUrl, addFiles } from './clients/axios/petService/addFiles.ts'  // plugin-client
export { addFiles } from './cypress/petRequests/addFiles.ts'                        // plugin-cypress
```

The identifier `addFiles` is declared twice, which is a TypeScript error. The same collision occurs for every other operation name (`addPet`, `deletePet`, `findPetsByStatus`, …).

### Reproduction

```
examples/advanced → pnpm run generate
src/gen/index.ts(2,26): error TS2300: Duplicate identifier 'addFiles'.
…
```

## Root cause

The barrel generator in `@kubb/core` (or the plugin that aggregates barrel entries) collects named exports from all plugins that write to sub-directories of the same output root. When two plugins export a symbol with the same short name (e.g. both `plugin-client` and `plugin-cypress` produce a function called `addFiles`), the flat `export { … }` style in the root barrel causes a collision.

## Proposed fix (in kubb packages)

The fix should be in the barrel generation logic, likely in `@kubb/core` or a shared barrel utility used by all plugins:

1. **Detect conflicts** — before writing the root barrel, collect all exported names across all plugin outputs. If a name appears more than once, flag it as a conflict.

2. **Resolve conflicts with namespace re-exports** — for conflicting names, switch from:
   ```ts
   export { addFiles } from './cypress/petRequests/addFiles.ts'
   ```
   to:
   ```ts
   export * as cypress from './cypress/index.ts'
   ```
   or prefix the conflicting exports:
   ```ts
   export { addFiles as cypressAddFiles } from './cypress/petRequests/addFiles.ts'
   ```

3. **Alternative — per-plugin sub-barrels only** — do not merge all plugin outputs into a single flat barrel. Instead, generate one barrel per plugin sub-directory (`clients/index.ts`, `cypress/index.ts`, …) and let the root barrel re-export each namespace:
   ```ts
   export * as clients from './clients/index.ts'
   export * as cypress from './cypress/index.ts'
   export * as mocks from './mocks/index.ts'
   // …
   ```

## Affected packages

- `@kubb/core` — barrel generation / `barrelType: 'named'` implementation
- Possibly `@kubb/plugin-client`, `@kubb/plugin-cypress`, `@kubb/plugin-msw`, `@kubb/plugin-faker`, `@kubb/plugin-mcp` if each plugin provides its own barrel entries to the aggregator

## Affected examples

- `examples/advanced` — uses all plugins with a single shared output root and `barrelType: 'named'`; `npm run typecheck` fails with duplicate identifier errors after `pnpm generate`

## No kubb.config.ts changes required

The `kubb.config.ts` files themselves need **no changes**. The fix is entirely inside the kubb package barrel-generation logic.
