# Plan: Resolving Barrel File Generation Issues (alpha.55)

## Context

During the upgrade from `@kubb/*@5.0.0-alpha.53` to `@kubb/*@5.0.0-alpha.55`, barrel file (`index.ts`) generation stopped working. This document explains **why**, and what changes are needed — both in this repo and in the upstream `kubb-labs/kubb` repo — to restore it.

---

## Root Cause Analysis

### What changed in alpha.55

In alpha.53, barrel file generation was **built into `@kubb/core`** — it ran inline, during the plugin loop, before files were written to disk. In alpha.55 ([PR #3135](https://github.com/kubb-labs/kubb/pull/3135)), this was extracted into a standalone `@kubb/middleware-barrel` package. The middleware hooks into two lifecycle events:

| Event | Purpose |
|---|---|
| `kubb:plugin:end` | Generate a per-plugin `index.ts` barrel |
| `kubb:build:end` | Generate the root `index.ts` barrel |

### Bug 1 — Wrong path in per-plugin barrel (`@kubb/middleware-barrel`)

**File:** `packages/middleware-barrel/src/utils/generatePerPluginBarrel.ts` in `kubb-labs/kubb`

The middleware computes the plugin output directory as:

```ts
// current (wrong)
resolve(config.root, plugin.options.output.path)
```

But `plugin.options.output.path` is **relative to the root output directory**, not to `config.root`. The resolver context (`getContext()` in `PluginDriver`) defines:

```ts
get root() {
  return resolve(driver.config.root, driver.config.output.path);
}
```

So all generated files land at `config.root + config.output.path + plugin.output.path`. The middleware must match that:

```ts
// correct fix
resolve(config.root, config.output.path, plugin.options.output.path)
```

**Example:**
- `config.root = '.'`, `config.output.path = 'src/gen'`, `plugin.output.path = 'models/ts'`
- Files are written to `./src/gen/models/ts/*.ts`
- Middleware searches `./models/ts` → finds nothing → generates no barrel

### Bug 2 — Root barrel generated after file writing (`@kubb/middleware-barrel`)

**File:** `packages/middleware-barrel/src/middleware.ts` in `kubb-labs/kubb`

The `kubb:build:end` event fires **after** `fileProcessor.run()` has already written all files to disk. The middleware calls `ctx.upsertFile(rootBarrel)` which adds the root barrel to the file manager cache, but no second write pass is triggered. The file is created in memory and immediately discarded.

**Sequence in `@kubb/core` `createKubb.ts`:**

```
1. plugins run → kubb:plugin:end fires per plugin (barrels upserted here — but Bug 1 means nothing is generated)
2. const files = driver.fileManager.files   ← snapshot taken
3. fileProcessor.run(files)                 ← files written to disk
4. kubb:build:end fires                     ← root barrel generated here (too late — nothing is written)
```

The root barrel must be generated **before** step 3, not in step 4.

---

## Required Fixes

### Fix 1 — In `kubb-labs/kubb`: correct the per-plugin path

**File:** `packages/middleware-barrel/src/utils/generatePerPluginBarrel.ts`

```diff
- return getBarrelFiles(resolve(config.root, plugin.options.output.path), files, barrelType)
+ return getBarrelFiles(resolve(config.root, config.output.path, plugin.options.output.path), files, barrelType)
```

### Fix 2 — In `kubb-labs/kubb`: move root barrel generation before file writing

**Option A (preferred):** Move root barrel generation into a new `kubb:files:processing:start` or `kubb:plugin:all:end` event that fires **before** `fileProcessor.run()`, similar to how alpha.53 handled it.

**Option B:** Add a second write pass in `@kubb/core` triggered after `kubb:build:end`, so that any files upserted during that event are also persisted.

**Option C (minimal):** Emit a dedicated `kubb:pre:write` event between the plugin loop and `fileProcessor.run()`, where middleware can add final files (root barrel, etc.) before writing.

The cleanest approach is **Option A** — add a `kubb:plugins:end` event that fires once, after all plugins have run and all per-plugin barrels have been upserted, but before files are written:

```ts
// in createKubb.ts, between the plugin loop and fileProcessor.run():
await hooks.emit('kubb:plugins:end', { config, files: driver.fileManager.files, upsertFile })

// middleware-barrel listens here instead of kubb:build:end for the root barrel
```

---

## Validation

Once the upstream fixes land in a new alpha, re-run:

```bash
pnpm install --no-frozen-lockfile
pnpm build
pnpm generate   # in examples/advanced — should write index.ts files
pnpm typecheck
pnpm test
```

Expected after fix:
- `examples/advanced/src/gen/index.ts` — root barrel (`export type { … } from './models/ts/AddPetRequest.ts'` …)
- `examples/advanced/src/gen/models/ts/index.ts` — per-plugin barrel for plugin-ts
- `examples/advanced/src/gen/zod/index.ts` — per-plugin barrel for plugin-zod
- … and so on for each plugin with `barrelType` set

---

## Current State (alpha.55 as of this writing)

| Area | Status |
|---|---|
| TypeScript types (`jsxRenderer` import) | ✅ Fixed — updated to `@kubb/renderer-jsx@5.0.0-alpha.55` which re-exports `jsxRenderer` |
| `requestBody.schema` → `requestBody.content[0].schema` API | ✅ Fixed — all source and test files migrated |
| Per-plugin barrel files (`src/gen/models/ts/index.ts`, etc.) | ❌ Broken — Bug 1 (wrong path in `generatePerPluginBarrel`) |
| Root barrel file (`src/gen/index.ts`) | ❌ Broken — Bug 2 (generated after file writing in `kubb:build:end`) |
| Unit tests (all packages) | ✅ Passing |
| Integration generation (201 non-barrel files) | ✅ Passing |

---

## Upstream Issue to File

File a bug against `kubb-labs/kubb` referencing this analysis:

> **Title:** `@kubb/middleware-barrel@5.0.0-alpha.55` generates no barrel files
>
> **Steps to reproduce:** Use any config with `output: { path: 'src/gen', barrelType: 'named' }` and at least one plugin with a relative `output.path` (e.g. `'models/ts'`). Run `kubb generate`. No `index.ts` files are created.
>
> **Root causes:**
> 1. `generatePerPluginBarrel` uses `resolve(config.root, plugin.output.path)` but files are at `resolve(config.root, config.output.path, plugin.output.path)`.
> 2. `generateRootBarrel` runs inside `kubb:build:end`, which fires after `fileProcessor.run()` has already written files — the generated barrel is never persisted.
