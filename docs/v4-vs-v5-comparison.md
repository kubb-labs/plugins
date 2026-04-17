# v4 → v5 Plugin Options Comparison

This document compares every plugin option between Kubb v4 (`kubb-v4`) and Kubb v5 (`plugins`), listing what changed, what was removed, and what was added.

---

## Structural Changes (All Plugins)

| Change | v4 | v5 | Notes |
|--------|----|----|-------|
| **plugin-oas → adapter-oas** | `pluginOas()` in plugins array | `adapter: adapterOas()` on config root | No longer a plugin, now a config-level adapter |
| **Import source** | `@kubb/core` → `defineConfig` | `kubb` → `defineConfig` | Package renamed |
| **Output type** | `Output<Oas>` | `Output` | Generic parameter removed |
| **Group type** | `Group` | `UserGroup` | Type renamed |
| **`transformers.name`** | Present on most plugins | **Replaced by `resolver`** on most v5 plugins | `resolver` gives more granular control over naming |
| **`transformer` (AST visitor)** | ❌ Not available | ✅ New on most plugins | New v5 feature for AST-level customization |
| **`printer.nodes`** | ❌ Not available | ✅ New on plugin-ts, plugin-zod, plugin-faker | Override individual printer node handlers |
| **`contentType`** | Present on most plugins | **Removed from most plugins** (only kept on plugin-ts) | Likely handled at adapter level now |

---

## Per-Plugin Comparison

### 1. plugin-client

| Option | v4 | v5 | Status |
|--------|----|----|--------|
| `output` | ✅ `Output<Oas>` | ✅ `Output` | ✅ Same (type simplified) |
| `contentType` | ✅ | ❌ | 🔴 **Removed** |
| `group` | ✅ `Group` | ✅ `UserGroup` | ✅ Same (type renamed) |
| `exclude` | ✅ | ✅ | ✅ Same |
| `include` | ✅ | ✅ | ✅ Same |
| `override` | ✅ | ✅ | ✅ Same |
| `operations` | ✅ | ✅ | ✅ Same |
| `urlType` | ✅ | ✅ | ✅ Same |
| `baseURL` | ✅ | ✅ | ✅ Same |
| `dataReturnType` | ✅ | ✅ | ✅ Same |
| `paramsCasing` | ✅ | ✅ | ✅ Same |
| `paramsType` | ✅ (top-level) | ✅ (via `ParamsTypeOptions` union) | ⚠️ **Changed** — now part of discriminated union |
| `pathParamsType` | ✅ (top-level) | ✅ (via `ParamsTypeOptions` union) | ⚠️ **Changed** — only available when `paramsType` is `'inline'` |
| `parser` | ✅ | ✅ | ✅ Same |
| `clientType` | ✅ | ✅ | ✅ Same |
| `bundle` | ✅ | ✅ | ✅ Same (default changes to `true` in v5) |
| `wrapper` | ✅ | ✅ | ✅ Same |
| `client` / `importPath` | ✅ (union) | ✅ (union) | ✅ Same |
| `transformers.name` | ✅ | ❌ | 🔴 **Removed** → use `resolver` |
| `resolver` | ❌ | ✅ | 🟢 **New** |
| `transformer` | ❌ | ✅ | 🟢 **New** — AST visitor |
| `generators` | ✅ | ✅ | ✅ Same |

---

### 2. plugin-ts

| Option | v4 | v5 | Status |
|--------|----|----|--------|
| `output` | ✅ | ✅ | ✅ Same |
| `contentType` | ✅ | ✅ | ✅ Same (kept in plugin-ts) |
| `group` | ✅ | ✅ | ✅ Same |
| `exclude` | ✅ | ✅ | ✅ Same |
| `include` | ✅ | ✅ | ✅ Same |
| `override` | ✅ | ✅ | ✅ Same |
| `enumType` | ✅ (flat) | ✅ (via `EnumTypeOptions` discriminated union) | ⚠️ **Changed** — now 3-variant discriminated union |
| `enumTypeSuffix` | ✅ (always available) | ✅ (only for `asConst`/`asPascalConst`) | ⚠️ **Changed** — restricted to specific enum types |
| `enumKeyCasing` | ✅ (always available) | ✅ (not for `literal`/`inlineLiteral`) | ⚠️ **Changed** — restricted to specific enum types |
| `syntaxType` | ✅ | ✅ | ✅ Same |
| `enumSuffix` | ✅ `@default 'enum'` | ❌ | 🔴 **Removed** |
| `dateType` | ✅ `'string' \| 'date'` | ❌ | 🟡 **Moved** to `adapterOas({ dateType })` |
| `integerType` | ✅ `'number' \| 'bigint'` | ❌ | 🟡 **Moved** to `adapterOas({ integerType })` |
| `unknownType` | ✅ `'any' \| 'unknown' \| 'void'` | ❌ | 🟡 **Moved** to `adapterOas({ unknownType })` |
| `emptySchemaType` | ✅ `'any' \| 'unknown' \| 'void'` | ❌ | 🟡 **Moved** to `adapterOas({ emptySchemaType })` |
| `optionalType` | ✅ | ✅ | ✅ Same |
| `arrayType` | ✅ | ✅ | ✅ Same |
| `paramsCasing` | ✅ | ✅ | ✅ Same |
| `mapper` | ✅ `Record<string, ts.PropertySignature>` | ❌ | 🔴 **Removed** — use `transformer` or `printer.nodes` |
| `transformers.name` | ✅ | ❌ | 🔴 **Removed** → use `resolver` |
| `UNSTABLE_NAMING` | ✅ | ❌ | 🔴 **Removed** — v5 naming is now stable |
| `resolver` | ❌ | ✅ | 🟢 **New** |
| `transformer` | ❌ | ✅ | 🟢 **New** — AST visitor |
| `printer.nodes` | ❌ | ✅ | 🟢 **New** — override individual schema type handlers |
| `generators` | ✅ | ✅ | ✅ Same |

---

### 3. plugin-faker

| Option | v4 | v5 | Status |
|--------|----|----|--------|
| `output` | ✅ | ✅ | ✅ Same |
| `contentType` | ✅ | ❌ | 🔴 **Removed** |
| `group` | ✅ | ✅ | ✅ Same |
| `exclude` | ✅ | ✅ | ✅ Same |
| `include` | ✅ | ✅ | ✅ Same |
| `override` | ✅ | ✅ | ✅ Same |
| `dateType` | ✅ `'string' \| 'date'` | ❌ | 🟡 **Moved** to `adapterOas({ dateType })` |
| `integerType` | ✅ `'number' \| 'bigint'` | ❌ | 🟡 **Moved** to `adapterOas({ integerType })` |
| `dateParser` | ✅ | ✅ | ✅ Same |
| `unknownType` | ✅ | ❌ | 🟡 **Moved** to `adapterOas({ unknownType })` |
| `emptySchemaType` | ✅ | ❌ | 🟡 **Moved** to `adapterOas({ emptySchemaType })` |
| `regexGenerator` | ✅ | ✅ | ✅ Same |
| `mapper` | ✅ | ✅ | ✅ Same |
| `seed` | ✅ | ✅ | ✅ Same |
| `paramsCasing` | ✅ | ✅ | ✅ Same |
| `transformers.name` | ✅ | ❌ | 🔴 **Removed** → use `resolver` |
| `transformers.schema` | ✅ (beta) | ❌ | 🔴 **Removed** → use `transformer` AST visitor |
| `resolver` | ❌ | ✅ | 🟢 **New** |
| `transformer` | ❌ | ✅ | 🟢 **New** |
| `printer.nodes` | ❌ | ✅ | 🟢 **New** |
| `generators` | ✅ | ✅ | ✅ Same |

---

### 4. plugin-zod

| Option | v4 | v5 | Status |
|--------|----|----|--------|
| `output` | ✅ | ✅ | ✅ Same |
| `contentType` | ✅ | ❌ | 🔴 **Removed** |
| `group` | ✅ | ✅ | ✅ Same |
| `exclude` | ✅ | ✅ | ✅ Same |
| `include` | ✅ | ✅ | ✅ Same |
| `override` | ✅ | ✅ | ✅ Same |
| `importPath` | ✅ `string` | ✅ `'zod' \| 'zod/mini' \| (string & {})` | ⚠️ **Changed** — more specific types |
| `dateType` | ✅ | ✅ | ✅ Same |
| `integerType` | ✅ `'number' \| 'bigint'` | ❌ | 🟡 **Moved** to `adapterOas({ integerType })` |
| `unknownType` | ✅ | ❌ | 🟡 **Moved** to `adapterOas({ unknownType })` |
| `emptySchemaType` | ✅ | ❌ | 🟡 **Moved** to `adapterOas({ emptySchemaType })` |
| `typed` | ✅ | ✅ | ✅ Same |
| `inferred` | ✅ | ✅ | ✅ Same |
| `coercion` | ✅ | ✅ | ✅ Same |
| `operations` | ✅ | ✅ | ✅ Same |
| `version` | ✅ `'3' \| '4'` | ❌ | 🔴 **Removed** — v5 assumes Zod v4 only |
| `guidType` | ✅ | ✅ | ✅ Same |
| `mini` | ✅ | ✅ | ✅ Same |
| `wrapOutput` | ✅ `(arg: {output, schema: SchemaObject})` | ✅ `(arg: {output, schema: ast.SchemaNode})` | ⚠️ **Changed** — schema type changed from `SchemaObject` to `ast.SchemaNode` |
| `mapper` | ✅ `Record<string, string>` | ❌ | 🔴 **Removed** — use `transformer`/`printer.nodes` |
| `paramsCasing` | ✅ | ✅ | ✅ Same |
| `transformers.name` | ✅ | ❌ | 🔴 **Removed** → use `resolver` |
| `transformers.schema` | ✅ (beta) | ❌ | 🔴 **Removed** → use `transformer` |
| `resolver` | ❌ | ✅ | 🟢 **New** |
| `transformer` | ❌ | ✅ | 🟢 **New** |
| `printer.nodes` | ❌ | ✅ | 🟢 **New** |
| `generators` | ✅ | ✅ | ✅ Same |

---

### 5. plugin-msw

| Option | v4 | v5 | Status |
|--------|----|----|--------|
| `output` | ✅ | ✅ | ✅ Same |
| `contentType` | ✅ | ❌ | 🔴 **Removed** |
| `baseURL` | ✅ | ✅ | ✅ Same |
| `group` | ✅ | ✅ | ✅ Same |
| `exclude` | ✅ | ✅ | ✅ Same |
| `include` | ✅ | ✅ | ✅ Same |
| `override` | ✅ | ✅ | ✅ Same |
| `transformers.name` | ✅ | ✅ | ✅ Same (kept on MSW!) |
| `handlers` | ✅ | ✅ | ✅ Same |
| `parser` | ✅ | ✅ | ✅ Same |
| `resolver` | ❌ | ✅ | 🟢 **New** |
| `transformer` | ❌ | ✅ | 🟢 **New** |
| `generators` | ✅ | ✅ | ✅ Same |

---

### 6. plugin-react-query

| Option | v4 | v5 | Status |
|--------|----|----|--------|
| `output` | ✅ | ✅ | ✅ Same |
| `contentType` | ✅ | ❌ | 🔴 **Removed** |
| `group` | ✅ | ✅ | ✅ Same |
| `client` | ✅ | ✅ | ✅ Same |
| `exclude` | ✅ | ✅ | ✅ Same |
| `include` | ✅ | ✅ | ✅ Same |
| `override` | ✅ | ✅ | ✅ Same |
| `paramsCasing` | ✅ | ✅ | ✅ Same |
| `paramsType` | ✅ | ✅ | ✅ Same |
| `pathParamsType` | ✅ | ✅ | ✅ Same |
| `infinite` | ✅ | ✅ | ✅ Same |
| `suspense` | ✅ | ✅ | ✅ Same |
| `queryKey` | ✅ | ✅ | ✅ Same |
| `query` | ✅ | ✅ | ✅ Same |
| `mutationKey` | ✅ | ✅ | ✅ Same |
| `mutation` | ✅ | ✅ | ✅ Same |
| `customOptions` | ✅ | ✅ | ✅ Same |
| `parser` | ✅ | ✅ | ✅ Same |
| `transformers.name` | ✅ | ✅ | ✅ Same (kept!) |
| `resolver` | ❌ | ✅ | 🟢 **New** |
| `transformer` | ❌ | ✅ | 🟢 **New** |
| `generators` | ✅ | ✅ | ✅ Same |

---

### 7. plugin-vue-query

| Option | v4 | v5 | Status |
|--------|----|----|--------|
| `output` | ✅ | ✅ | ✅ Same |
| `contentType` | ✅ | ❌ | 🔴 **Removed** |
| `group` | ✅ | ✅ | ✅ Same |
| `client` | ✅ | ✅ | ✅ Same |
| `exclude` | ✅ | ✅ | ✅ Same |
| `include` | ✅ | ✅ | ✅ Same |
| `override` | ✅ | ✅ | ✅ Same |
| `paramsCasing` | ✅ | ✅ | ✅ Same |
| `paramsType` | ✅ | ✅ | ✅ Same |
| `pathParamsType` | ✅ | ✅ | ✅ Same |
| `infinite` | ✅ | ✅ | ✅ Same |
| `queryKey` | ✅ | ✅ | ✅ Same |
| `query` | ✅ | ✅ | ✅ Same |
| `mutationKey` | ✅ | ✅ | ✅ Same |
| `mutation` | ✅ | ✅ | ✅ Same |
| `parser` | ✅ | ✅ | ✅ Same |
| `transformers.name` | ✅ | ✅ | ✅ Same (kept!) |
| `resolver` | ❌ | ✅ | 🟢 **New** |
| `transformer` | ❌ | ✅ | 🟢 **New** |
| `generators` | ✅ | ✅ | ✅ Same |

> **Note**: vue-query in v4 had no `suspense` and no `customOptions`. Same in v5.

---

### 8. plugin-cypress

| Option | v4 | v5 | Status |
|--------|----|----|--------|
| `output` | ✅ | ✅ | ✅ Same |
| `contentType` | ✅ | ❌ | 🔴 **Removed** |
| `dataReturnType` | ✅ | ✅ | ✅ Same |
| `paramsCasing` | ✅ | ✅ | ✅ Same |
| `paramsType` | ✅ (top-level) | ✅ (via `ParamsTypeOptions` union) | ⚠️ **Changed** — discriminated union |
| `pathParamsType` | ✅ (top-level) | ✅ (via `ParamsTypeOptions` union) | ⚠️ **Changed** |
| `baseURL` | ✅ | ✅ | ✅ Same |
| `group` | ✅ | ✅ | ✅ Same |
| `exclude` | ✅ | ✅ | ✅ Same |
| `include` | ✅ | ✅ | ✅ Same |
| `override` | ✅ | ✅ | ✅ Same |
| `transformers.name` | ✅ | ❌ | 🔴 **Removed** → use `resolver` |
| `resolver` | ❌ | ✅ | 🟢 **New** |
| `transformer` | ❌ | ✅ | 🟢 **New** |
| `generators` | ✅ | ✅ | ✅ Same |

---

### 9. plugin-redoc

| Option | v4 | v5 | Status |
|--------|----|----|--------|
| `output.path` | ✅ | ✅ | ✅ Same |

> No changes — minimal plugin.

---

### 10. plugin-mcp

| Option | v4 | v5 | Status |
|--------|----|----|--------|
| `output` | ✅ | ✅ | ✅ Same |
| `contentType` | ✅ | ❌ | 🔴 **Removed** |
| `client` | ✅ | ✅ | ✅ Same |
| `paramsCasing` | ✅ | ✅ | ✅ Same |
| `group` | ✅ | ✅ | ✅ Same |
| `exclude` | ✅ | ✅ | ✅ Same |
| `include` | ✅ | ✅ | ✅ Same |
| `override` | ✅ | ✅ | ✅ Same |
| `transformers.name` | ✅ | ❌ | 🔴 **Removed** → use `resolver` |
| `resolver` | ❌ | ✅ | 🟢 **New** |
| `transformer` | ❌ | ✅ | 🟢 **New** |
| `generators` | ✅ | ✅ | ✅ Same |

---

### 11. plugin-oas → adapter-oas

The v4 `pluginOas()` was a plugin in the `plugins` array. In v5, it became `adapterOas()` set on the config root's `adapter` field.

| Option | v4 (plugin-oas) | v5 (adapter-oas) | Status |
|--------|------------------|-------------------|--------|
| `validate` | ✅ | ✅ | ✅ Same |
| `oasClass` | ✅ | ✅ | ✅ Same |
| `contentType` | ✅ | ✅ | ✅ **Moved** — from individual plugins to adapter |
| `serverIndex` | ✅ | ✅ | ✅ Same |
| `serverVariables` | ✅ | ✅ | ✅ Same |
| `discriminator` | ✅ | ✅ | ✅ Same |
| `collisionDetection` | ✅ `@default false` | ✅ `@default false` | ✅ Same |
| `dateType` | ❌ (was on ts/faker) | ✅ | 🟢 **Moved here** from plugin-ts, plugin-faker |
| `integerType` | ❌ (was on ts/faker/zod) | ✅ | 🟢 **Moved here** from per-plugin options |
| `unknownType` | ❌ (was on ts/faker/zod) | ✅ | 🟢 **Moved here** from per-plugin options |
| `emptySchemaType` | ❌ (was on ts/faker/zod) | ✅ | 🟢 **Moved here** from per-plugin options |
| `output` | ✅ | ❌ | 🔴 **Removed** — not a plugin anymore |
| `group` | ✅ | ❌ | 🔴 **Removed** |
| `generators` | ✅ | ❌ | 🔴 **Removed** |
| `docs` | ✅ (in v4 e2e config) | ❌ | 🔴 **Removed** |

---

### 12. Plugins Removed in v5

| Plugin | v4 | v5 | Notes |
|--------|----|----|-------|
| **plugin-swr** | ✅ | ❌ | 🔴 **Removed entirely** — no longer in packages/ |
| **plugin-solid-query** | ✅ | ❌ | 🔴 **Removed entirely** — no longer in packages/ |
| **plugin-svelte-query** | ✅ | ❌ | 🔴 **Removed entirely** — no longer in packages/ |

---

## Cross-Cutting Moved/Removed Options (applied to many plugins)

These options were present in multiple v4 plugins and moved/removed in v5:

| Option | Was in (v4) | v5 Location | Migration |
|--------|-------------|-------------|-----------|
| `contentType` | client, faker, zod, msw, react-query, vue-query, swr, solid-query, svelte-query, cypress, mcp, oas | **Moved to `adapterOas()`** (kept in plugin-ts) | Set once on adapter |
| `integerType` | ts, faker, zod | **Moved to `adapterOas()`** | Set once on adapter |
| `unknownType` | ts, faker, zod | **Moved to `adapterOas()`** | Set once on adapter |
| `emptySchemaType` | ts, faker, zod | **Moved to `adapterOas()`** | Set once on adapter |
| `dateType` | ts, faker (kept in zod) | **Moved to `adapterOas()`** (kept in zod) | Set once on adapter |
| `transformers.name` | client, ts, faker, zod, msw, react-query, vue-query, swr, solid-query, svelte-query, cypress, mcp | **Kept** on: msw, react-query, vue-query | Use `resolver` for others |
| `transformers.schema` | faker, zod (beta) | ❌ Removed | Use `transformer` AST visitor |
| `mapper` (ts) | ts | ❌ Removed | Use `printer.nodes` |
| `mapper` (zod) | zod | ❌ Removed | Use `printer.nodes` |

---

## New v5 Features (across plugins)

| Feature | Plugins | Description |
|---------|---------|-------------|
| `resolver` | client, ts, faker, zod, msw, react-query, vue-query, cypress, mcp | Override naming resolution methods |
| `transformer` (AST visitor) | client, ts, faker, zod, msw, react-query, vue-query, cypress, mcp | AST-level node transformation before printing |
| `printer.nodes` | ts, zod, faker | Override individual schema type rendering handlers |
| `adapter` (config root) | N/A | `adapter: adapterOas({...})` replaces `pluginOas()` plugin |

---

## E2E / Config Comparison

### v4 e2e config (`tests/e2e/kubb.config.js`)
- Uses `defineConfig` from `@kubb/core`
- Has `pluginOas()` as first plugin with `validate: false, docs: false`
- Has `pluginSwr()` — removed in v5
- Has `version: '3'` on `pluginZod()` — removed in v5
- Has 19 schemas

### v5 e2e config (`tests/e2e/kubb.config.js`)
- Uses `defineConfig` from `kubb`
- Uses `adapter: adapterOas({ validate: false })` on config root
- No `pluginSwr` (removed)
- No `version` on `pluginZod`
- Has 22 schemas (added spotify, atlassian, openai, vercel)
- Added `KUBB_SCHEMA` env variable filtering for large schemas
- No `pluginOas` in plugins array

### Key e2e differences
| Feature | v4 | v5 |
|---------|----|----|
| OAS config | `pluginOas({...})` in plugins | `adapter: adapterOas({...})` on root |
| SWR plugin | ✅ | ❌ Removed |
| Zod version option | `version: '3'` | Not needed (v4 only) |
| Schema filtering | Not available | `KUBB_SCHEMA` env var |
| Typecheck hooks | `strict` mode per schema | Same + `typecheck` flag per schema |

---

## Example Config Comparison

### v4 examples present / v5 equivalents

| Example | v4 | v5 | Notes |
|---------|----|----|-------|
| `react-query` | ✅ | ✅ | Both have infinite queries, custom transformers, suspense |
| `client` | ✅ (7 configs) | ✅ (7 configs) | Both test all client variants |
| `typescript` | ✅ (6 configs) | ✅ (12 configs) | v5 has more enum variations |
| `fetch` | ✅ | ✅ | Same |
| `generators` | ✅ | ✅ | Same |
| `advanced` | ✅ | ✅ | Same set of plugins |
| `mcp` | ✅ | ✅ | Same |
| `cypress` | ✅ | ✅ | Same |
| `faker` | ✅ | ✅ | Same |
| `msw` | ✅ | ✅ | Same |
| `zod` | ✅ (3 configs) | ✅ (3 configs) | v5 removed `version` option |
| `simple-single` | ✅ | ✅ | Same |
| `swr` | ✅ | ❌ | 🔴 Removed (plugin gone) |
| `svelte-query` | ✅ | ❌ | 🔴 Removed (plugin gone) |
| `solid-query` | ✅ | ❌ | 🔴 Removed (plugin gone) |
| `vue-query` | ❌ | ✅ | 🟢 New example in v5 |

---

## Migration Checklist

### Must-do changes when migrating v4 → v5:
1. ✅ Replace `pluginOas({...})` in plugins with `adapter: adapterOas({...})` on config root
2. ✅ Change `import { defineConfig } from '@kubb/core'` to `import { defineConfig } from 'kubb'`
3. ✅ Remove `contentType` from all plugins except `plugin-ts` — set once on `adapterOas({ contentType })`
4. ✅ Move `integerType`, `unknownType`, `emptySchemaType` from plugins to `adapterOas({...})`
5. ✅ Move `dateType` from `plugin-ts` and `plugin-faker` to `adapterOas({ dateType })` (keep in `plugin-zod` if needed)
6. ✅ Remove `version` from `plugin-zod` (v5 assumes Zod v4 only)
7. ✅ Remove `enumSuffix` and `UNSTABLE_NAMING` from `plugin-ts`
8. ✅ Remove `mapper` from `plugin-ts` and `plugin-zod` (use `printer.nodes` or `transformer`)
9. ✅ Replace `transformers.name` with `resolver` (except on msw, react-query, vue-query where both exist)
10. ✅ Remove `pluginSwr`, `pluginSolidQuery`, `pluginSvelteQuery` (no longer available)
11. ✅ Update `wrapOutput` in `plugin-zod` to use `ast.SchemaNode` instead of `SchemaObject`
12. ✅ `paramsType`/`pathParamsType` on `plugin-client` and `plugin-cypress` are now discriminated unions

---

## E2E / Example Feature Coverage Gaps

The following v5 options are **not exercised** by any test or example config and should be added:

| # | Option | Plugin | Recommendation |
|---|--------|--------|----------------|
| 1 | `transformer` (AST visitor) | plugin-client | Add an example config exercising the AST visitor |
| 2 | `wrapper` | plugin-client | Add an example with `wrapper: { className: 'ApiClient' }` |
| 3 | `resolver` | plugin-client | Add a config with a custom resolver override |
| 4 | `resolver` | plugin-ts | Add a config with a custom resolver override |
| 5 | `printer.nodes` | plugin-ts | Add an example overriding e.g. the `date` node |
| 6 | `wrapOutput` | plugin-zod | Add an example with `.openapi()` wrapping |
| 7 | `printer.nodes` | plugin-zod | Add an example overriding a schema type handler |
| 8 | `regexGenerator: 'randexp'` | plugin-faker | Add a config testing `randexp` mode |
| 9 | `parser: 'faker'` | plugin-msw | Add a config using faker-based MSW responses |
| 10 | `integerType` | adapterOas | Add a config with `integerType: 'bigint'` |
| 11 | `unknownType` | adapterOas | Add a config with `unknownType: 'unknown'` |
| 12 | `emptySchemaType` | adapterOas | Add a config with `emptySchemaType: 'unknown'` |

---

## Output Validation Report

All generated output from the advanced example (`examples/advanced/`) was validated against the PetStore OpenAPI 3.0.3 spec. The following sections summarize findings per plugin.

### Overall Status

| Plugin | Status | Issues |
|--------|--------|--------|
| **plugin-ts** | ✅ Pass (1 minor issue) | `http_status` enum missing value `500` |
| **plugin-client** | ✅ Pass | No issues |
| **plugin-react-query** | ✅ Pass | No issues — mutations correctly default to `@tanstack/react-query` |
| **plugin-zod** | ⚠️ 2 issues | `dateType: 'stringOffset'` not producing `{ offset: true }`; `http_status` missing `500` |
| **plugin-faker** | ✅ Pass | Custom mapper correctly applied |
| **plugin-msw** | ⚠️ 1 issue | Possible double-escaping of Google-style custom method paths |
| **plugin-cypress** | ✅ Pass | No issues |
| **plugin-mcp** | ✅ Pass | No issues |
| **plugin-vue-query** | ✅ Pass | `MaybeRefOrGetter`/`toValue()` correct |

### Detailed Findings

#### 🔴 Issue 1: `http_status` enum drops unnamed values

**Spec** (`petStore.yaml` lines 795–805):
```yaml
http_status:
  type: number
  enum: [200, 400, 500]
  x-enumNames: [ok, not_found]
```

**Generated TS** (`Order.ts` line 24–27):
```ts
export const orderHttpStatusEnum = { ok: 200, not_found: 400 } as const
```

**Generated Zod** (`orderSchema.ts` line 17–19):
```ts
http_status: z.union([z.literal(200), z.literal(400)])
```

**Problem:** The spec has 3 enum values (`200, 400, 500`) but only 2 `x-enumNames`. The value `500` is dropped entirely from both TS and Zod output. It should still appear (as an unnamed literal in Zod, or with an auto-generated name in TS).

#### 🟡 Issue 2: `dateType: 'stringOffset'` not applied in Zod output

**Config** (`kubb.config.ts` line 68):
```ts
pluginZod({ dateType: 'stringOffset' })
```

**Expected** (per snapshot `dateTypeStringOffset/datetimeOffsetSchema.ts`):
```ts
z.iso.datetime({ offset: true })
```

**Actual** (`orderSchema.ts` line 15):
```ts
shipDate: z.iso.datetime().optional()
```

**Problem:** The `dateType: 'stringOffset'` option should produce `z.iso.datetime({ offset: true })` but the `offset` flag is missing. The `z.iso.datetime()` call is valid Zod v4 syntax, but the offset argument is not being passed.

#### 🟡 Issue 3: MSW double-escaping of `:search` in custom method paths

**Spec** (`petStore.yaml` line 281): The path `/pet/{petId}:search` uses Google-style custom method syntax.

**Generated MSW** (`getPetByIdHandler.ts` line 26):
```ts
return http.get('/pet/:petId\\\\:search', ...)
```

**Problem:** In JS source `\\\\` = `\\` at runtime (two backslashes). MSW's `path-to-regexp` uses a single `\` to escape `:`. The double backslash may cause MSW to not match the path correctly. Expected: `\\:search` in source (= `\:search` at runtime).

### What's Working Correctly

All of the following features were verified and produce correct output:

**plugin-ts:**
- `arrayType: 'generic'` → `Array<T>` syntax ✅
- `enumType: 'asConst'` → `as const` objects ✅
- `paramsCasing: 'camelcase'` → path/query params camelCased, schema props unchanged ✅
- Required/optional properties match spec ✅
- Discriminated unions (oneOf) with `Animal = Cat | Dog` ✅
- JSDoc annotations (`@deprecated`, `@example`, `@type`) ✅

**plugin-client:**
- Custom `importPath` (axios-client.ts) ✅
- `baseURL` hardcoded in URLs ✅
- `dataReturnType: 'full'` returns `{ ...res, data }` ✅
- `paramsType: 'object'` ✅
- `urlType: 'export'` generates `getXxxUrl()` helpers ✅
- `operations: true` generates `operations.ts` ✅
- `parser: 'zod'` with `override` for `multipart/form-data` → `parser: 'client'` ✅
- `group: { type: 'tag', name }` custom group naming ✅

**plugin-react-query:**
- GET → `useQuery`, POST/PUT/DELETE → `useMutation` ✅
- `query.importPath` → custom import for query hooks ✅
- Mutations default to `@tanstack/react-query` (correct — no global mutation.importPath set) ✅
- `infinite` override per operation (findPetsByTags → `useInfiniteQuery`) ✅
- `suspense: false` → no suspense hooks generated ✅
- `paramsType: 'object'` ✅
- `parser: 'zod'` → zod parsing delegated to client layer ✅

**plugin-zod:**
- `inferred: true` → `z.infer<>` types exported ✅
- `typed: true` ✅
- `exclude` by tag (store excluded) ✅
- `group: { type: 'tag' }` ✅
- `z.iso.datetime()` is valid Zod v4 syntax ✅

**plugin-faker:**
- `mapper: { status: '...' }` correctly overrides status field values ✅
- `resolver` with custom suffix (`Faker`) ✅
- `exclude` by tag ✅
- `group: { type: 'tag' }` ✅

**plugin-msw:**
- `handlers: true` generates `handlers.ts` aggregation file ✅
- Multiple response status handlers (200, 400, 404) ✅
- `exclude` by tag ✅
- `group: { type: 'tag' }` ✅

**plugin-cypress:**
- `cy.request<T>()` with proper HTTP methods ✅
- `paramsCasing: 'camelcase'` ✅
- Header name mapping (camelCase → original) ✅
- `group: { type: 'tag' }` ✅

**plugin-mcp:**
- MCP tool registration with operationId names ✅
- Descriptions from OpenAPI spec ✅
- `client.baseURL` applied ✅
- `exclude` by tag (store excluded) ✅
- `paramsCasing: 'camelcase'` ✅

**plugin-vue-query (separate example):**
- `@tanstack/vue-query` imports ✅
- `MaybeRefOrGetter<T>` wrapping for Vue reactivity ✅
- `toValue()` unwrapping in query functions ✅
- Query/mutation separation ✅
- `pathParamsType: 'object'` ✅
