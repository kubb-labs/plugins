# Barrel Generation — Diagnosis & Fix Plan

## Current State

`pnpm generate` runs but barrel files are **not generated correctly** in several examples, causing TypeScript errors and malformed `export` statements.

---

## Root Cause Analysis

### Bug 1 — Non-TypeScript files included in barrels

**Where**: `@kubb/middleware-barrel` → `utils/getBarrelFiles.ts`, `getBarrelFiles()` function  
**Lines in question**:
```ts
const relevantFiles = files.filter((f) => {
  return normalizedFilePath.startsWith(normalizedOutputPath + '/') && !normalizedFilePath.endsWith(`/${BARREL_FILENAME}`)
})
```
There is no extension filter, so `.json`, `.html`, and other non-TS files are included.

**Why this causes malformed paths**

The barrel path for `.mcp.json` is computed by `toRelativeModulePath`, which strips the last extension:
- `.mcp.json` → strips `.json` → `.mcp`
- The relative path becomes `./mcp/.mcp` (advanced example) or `./.mcp` (mcp example)

Then `@kubb/parser-ts` converts the export path with the output `extension` config:
- `/\.[^/.]+$/` on `.mcp` matches `.mcp` as an "extension"
- `trimExtName('./mcp/.mcp')` → `./mcp/`
- With `.ts` appended → `./mcp/.ts` ← malformed (**advanced** example)
- With `.js` appended → `./.js` ← malformed (**mcp** example, which uses `extension: {'.ts': '.js'}`)

**Affected examples**:
- `examples/advanced/src/gen/index.ts`: `export * from "./mcp/.ts"` (malformed)
- `examples/mcp/src/gen/mcp/index.ts`: `export * from "./.js"` (malformed)
- `examples/advanced/src/gen/index.ts`: `export * from "./docs"` (wrong – `docs.html` should be excluded)

**Fix in `@kubb/middleware-barrel`**:

In `getBarrelFiles.ts`, add an extension filter to `relevantFiles`:
```ts
import { extname } from 'node:path'

const TS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const relevantFiles = files.filter((f) => {
  const normalizedFilePath = f.path.replace(/\\/g, '/')
  const normalizedOutputPath = outputPath.replace(/\\/g, '/')
  const ext = extname(f.path)
  return (
    normalizedFilePath.startsWith(normalizedOutputPath + '/') &&
    !normalizedFilePath.endsWith(`/${BARREL_FILENAME}`) &&
    TS_EXTENSIONS.has(ext)   // ← add this
  )
})
```

---

### Bug 2 — Files with all `isIndexable: false` sources still exported

**Where**: `@kubb/middleware-barrel` → `utils/getBarrelFiles.ts`, `getBarrelFilesNamed()`  
**Lines in question**:
```ts
const indexableSources = sourceFile.sources.filter((s) => s.isIndexable && s.name)
if (indexableSources.length === 0) {
  // No named exports: fall back to wildcard
  exports.push(createExport({ path: toRelativeModulePath(treeNode.path, filePath) }))
  continue
}
```
When all sources have `isIndexable: false`, the file still gets a wildcard `export *`. This exposes internal files (like `.kubb/config.ts`) to consumers.

**Affected examples**:
- `examples/advanced/src/gen/index.ts`: `export * from "./.kubb/config"` ← internal file, should be absent
- `examples/simple-single/src/gen/index.ts`: `export * from "./.kubb/config"` ← same

**Fix in `@kubb/middleware-barrel`**:

In `getBarrelFilesNamed`, skip files whose sources are all non-indexable:
```ts
const indexableSources = sourceFile.sources.filter((s) => s.isIndexable && s.name)
// If the file has sources but none are indexable, skip it from the barrel entirely
if (indexableSources.length === 0 && sourceFile.sources.length > 0) {
  continue   // ← do NOT fall back to wildcard
}
if (indexableSources.length === 0) {
  // No sources at all (file metadata only) → fall back to wildcard
  exports.push(createExport({ path: toRelativeModulePath(treeNode.path, filePath) }))
  continue
}
```

Apply the same logic to `getBarrelFilesAll`: check `sourceFile?.sources.every(s => !s.isIndexable)` and `continue` instead of adding the export.

---

### Bug 3 — Missing barrels in `react-query` example

**Where**: `examples/react-query/kubb.config.ts`

The app code imports barrel files that are never generated:
- `src/App.tsx:3` → `import ... from './gen/hooks/index.ts'` ← no hooks barrel
- `src/App.tsx:4` → `import ... from './gen/models'` ← no models barrel
- `src/useCustomHookOptions.ts:3` → `import ... from './gen/index.ts'` ← no root barrel

**Cause**: The `output` overrides in the config omit `barrelType`, which disables barrel generation for those outputs (the plugin default of `barrelType: 'named'` only applies when `output` is **completely** absent — when you pass `output: { path: 'models' }`, the default is not merged in).

**Fix in `examples/react-query/kubb.config.ts`**:
1. Add `barrelType: 'named'` to the root `output` (generates `src/gen/index.ts`)
2. Add `barrelType: 'named'` to `pluginTs`'s `output` (generates `src/gen/models/index.ts`)
3. Add `barrelType: 'named'` to `pluginReactQuery`'s `output` (generates `src/gen/hooks/index.ts`)

```ts
output: { path: './src/gen', clean: true, barrelType: 'named', defaultBanner: 'simple' },
// ...
pluginTs({ output: { path: 'models', barrelType: 'named', banner(oas) { ... } } }),
pluginReactQuery({ output: { path: './hooks', barrelType: 'named' }, ... }),
```

---

### Bug 4 — Missing root barrel in `sdk` example

**Where**: `examples/sdk/kubb.config.ts`

`src/index.ts` re-exports from `'./gen/index'`, which does not exist.  
The sdk config sets `barrelType: 'propagate'` for the sdk plugin output but has no `barrelType` on the root `output`, so no root `gen/index.ts` is produced.

**Fix in `examples/sdk/kubb.config.ts`**:
Add `barrelType: 'named'` to the root `output`:
```ts
output: { path: './src/gen', barrelType: 'named' },
```

---

### Bug 5 — Barrel export paths don't get `output.extension` applied

**Where**: `@kubb/middleware-barrel` → `utils/getBarrelFiles.ts`, `toRelativeModulePath()`

**Symptom**: When `output.extension = { '.ts': '.js' }` is set (ESM output), regular generated files correctly use `.js` imports (e.g., `import ... from "../models/ts/AddFiles.js"`), but barrel export paths have no extension (e.g., `export { addFilesHandler } from "./addFiles"` instead of `"./addFiles.js"`).

**Root cause**:

`toRelativeModulePath` strips the source extension entirely:
```ts
return `./${relative.replace(/\.[^/.]+$/, '')}` // strips .ts → no extension left
```

`@kubb/parser-ts` applies the `extNames` mapping only when `hasExtname` is true:
```ts
const hasExtname = !!/\.[^/.]+$/.exec(exportPath) // false for "./addFiles"
path: options?.extname && hasExtname
  ? `${trimExtName(item.path)}${options.extname}`   // skipped when hasExtname=false
  : trimExtName(item.path)                           // returns "./addFiles" unchanged
```

Since the barrel export path `"./addFiles"` has no extension, `hasExtname` is false, the mapping is never applied, and the output is missing the required `.js` extension.

**Why it accidentally works for `extension: { '.ts': '' }`** (like `simple-single`): `"./addFiles"` (extensionless) is the correct final output when the target extension is empty, so stripping in the barrel and skipping the mapping both produce the same result.

**Affected examples**:
- `examples/mcp/src/gen/mcp/index.ts`: all exports missing `.js` extension (e.g., `export { addFilesHandler } from "./addFiles"` should be `"./addFiles.js"`)

**Fix in `@kubb/middleware-barrel`**:

Change `toRelativeModulePath` to **preserve** the source extension so `@kubb/parser-ts` can apply the `extNames` mapping:
```ts
// Before (strips extension — breaks extNames mapping):
function toRelativeModulePath(fromDir: string, filePath: string): string {
  const relative = filePath.slice(fromDir.length).replace(/^[/\\]/g, '')
  return `./${relative.replace(/\.[^/.]+$/, '')}`   // ← removes .ts
}

// After (preserve extension — parser-ts can apply extNames):
function toRelativeModulePath(fromDir: string, filePath: string): string {
  const relative = filePath.slice(fromDir.length).replace(/^[/\\]/g, '')
  return `./${relative}`   // ← keep .ts so parser-ts converts to .js / '' / etc.
}
```

**Resulting behaviour by `output.extension` value**:

| `output.extension` | path in barrel `ExportNode` | `@kubb/parser-ts` output |
|---|---|---|
| `{ '.ts': '.js' }` | `./addFiles.ts` | `./addFiles.js` ✓ |
| `{ '.ts': '' }` | `./addFiles.ts` | `./addFiles` ✓ |
| `{ '.ts': '.ts' }` (default) | `./addFiles.ts` | `./addFiles.ts` ✓ |

**Interaction with Bug 1**: This fix must be combined with the Bug 1 extension filter. Without the filter, non-TS filenames like `.mcp.json` would produce `toRelativeModulePath` output `./.mcp.json`, and parser-ts would strip `.json` and append `.js` → `./.mcp.js` (still malformed). The two fixes work together: Bug 1 excludes non-TS files before they reach `toRelativeModulePath`; Bug 5 preserves `.ts` so parser-ts can apply `extNames`.

---

## Summary Table

| # | Issue | Location | Fix needed in |
|---|-------|----------|---------------|
| 1 | Non-TS files (`.json`, `.html`) included in barrels → malformed export paths | `@kubb/middleware-barrel` `getBarrelFiles.ts` | `@kubb/middleware-barrel` |
| 2 | `isIndexable: false` files still barrel-exported as `export *` | `@kubb/middleware-barrel` `getBarrelFiles.ts` | `@kubb/middleware-barrel` |
| 3 | Missing `barrelType` in react-query config → no barrels generated | `examples/react-query/kubb.config.ts` | This repo |
| 4 | Missing root `barrelType` in sdk config → no root barrel | `examples/sdk/kubb.config.ts` | This repo |
| 5 | `toRelativeModulePath` strips `.ts` extension → `output.extension` mapping never applied to barrel exports | `@kubb/middleware-barrel` `getBarrelFiles.ts` | `@kubb/middleware-barrel` |

## No changes needed in `@kubb/core`

The core's `FileProcessor` correctly applies extension conversion at write time.  
The barrel middleware's interaction with `ctx.files` (via `kubb:plugins:end`) is correct.  
The bugs are isolated to the barrel middleware's file-selection, skip logic, and `toRelativeModulePath` stripping, plus the example configs missing `barrelType` values.
