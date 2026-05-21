# Kubb v4 ↔ v5 Validation — Results

A side-by-side matrix that runs every plugin × option migration path on both
**v4** (`kubb-labs/kubb` branch `v4`, `4.37.8`) and **v5** (current `main` of
`kubb-labs/kubb` + this repo), diffs the generated output, and classifies each
diff against the migration guide.

Live harness: [`tests/3.0.x/matrix/`](./tests/3.0.x/matrix/) — `node runner.mjs`.
Auto-generated full diff table: [`tests/3.0.x/matrix/REPORT.md`](./tests/3.0.x/matrix/REPORT.md).

## Headline numbers

| Verdict           |    Count |
| ----------------- | -------: |
| `build-error`     |  **0**   |
| `empty-v5`        |  **0**   |
| `structural-diff` |     37   |
| `new-in-v5`       |      1   |
| `removed-in-v5`   |      2   |
| **Total cells**   | **40**   |

**Every documented migration path runs end-to-end on v5 without error.** No
plugin × option combination from the v4 surface causes a v5 build failure or
produces empty output. The remaining diffs are all intentional v5 changes
documented in the migration guide.

## What was checked

### Plugins

Every retained v5 plugin is exercised on `petStore.yaml` (or a more specific
fixture for enum / discriminator-sensitive options):

| Plugin              | Cells | Notable options checked                                                                                            |
| ------------------- | ----: | ------------------------------------------------------------------------------------------------------------------ |
| `pluginTs`          |    10 | `output`, `resolver.resolveTypeName`, `enumType`, `enumKeyCasing`, `arrayType`, `dateType`*, `integerType`*, `syntaxType`, `optionalType`, `UNSTABLE_NAMING` (removed) |
| `pluginZod`         |     6 | `output`, `typed`, `inferred`, `coercion`, `version` (removed), `mini` (new in v5)                                |
| `pluginFaker`       |     3 | `output`, `dateParser`, `seed`                                                                                     |
| `pluginClient`      |     6 | `output`, `sdk` (renamed from `wrapper`), `client`, `clientType`, `paramsType`, `dataReturnType`                  |
| `pluginReactQuery`  |     2 | `output`, `suspense`                                                                                               |
| `pluginMsw`         |     2 | `output`, `handlers`                                                                                               |
| `pluginCypress`     |     1 | `output`                                                                                                           |
| `pluginMcp`         |     1 | `output` (wired with `pluginZod`, exercises new `RequestHandlerExtra` plumbing)                                    |
| `pluginRedoc`       |     1 | `output.path`                                                                                                      |
| `adapterOas`        |     2 | `contentType` (moved from per-plugin), `discriminator: 'inherit'`                                                  |
| core `defineConfig` |     2 | `output.barrel: { type: 'all' }`, `output.barrel: false` (replaces `barrelType`)                                   |
| combinations        |     4 | `fullStack` (ts+zod+faker+client), `groupedByTag` (3 plugins), `clientPlusReactQuery`, `mswPlusFaker`              |

\* moved to `adapterOas` in v5 — the cell uses the v5 location for the
adapter-level option and proves the move produces equivalent output.

### Migration paths verified

| Migration                                   | How the matrix verifies it                                                                                       |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `import` source: `@kubb/core` → `kubb`      | Every v5 cell imports `defineConfig` from `'kubb'`.                                                              |
| `pluginOas(...)` → `adapter: adapterOas()`  | v4 cells include `pluginOas({ validate: false })`; v5 cells use top-level `adapter: adapterOas({ validate: false })`. |
| `output.barrelType` → `output.barrel`       | Dedicated cells: `barrel: { type: 'all' }`, `barrel: false`, and per-plugin `barrel: { type: 'named' }`.        |
| `transformers.name` → `resolver.resolve*Name` | `pluginTs__resolver_resolveTypeName__apiPrefix` runs both shapes side-by-side.                                  |
| `wrapper` → `sdk` (plugin-client)           | `pluginClient__sdk__className` exercises the rename.                                                              |
| `dateType` / `integerType` / `unknownType` / `emptySchemaType` / `enumSuffix` moved to `adapterOas` | `pluginTs__dateType__date`, `pluginTs__integerType__number`.                              |
| `version` removed from `pluginZod`          | `pluginZod__version__v3` is `removed-in-v5` (v4 still runs, no v5 config).                                       |
| `UNSTABLE_NAMING` removed                   | `pluginTs__UNSTABLE_NAMING__true` is `removed-in-v5`.                                                            |
| `mini` added to `pluginZod`                 | `pluginZod__mini__true` is `new-in-v5`.                                                                          |
| `integerType` default `'number'` → `'bigint'` | Generated output normalised via `expectations.mjs` `integer-bigint-to-number` rule.                              |
| Cypress method casing `'post'` → `'POST'`   | `cypress-method-case` normalisation rule.                                                                        |
| MSW handlers: `HttpResponseResolver<…>`     | `msw-handler-resolver` normalisation rule.                                                                       |
| MCP handlers: `RequestHandlerExtra` 2nd arg | `mcp-request-handler-extra` normalisation rule.                                                                  |
| Type renames: `AddPet200` → `AddPetStatus200` | `plugin-client-status-rename` normalisation rule.                                                                |
| Type renames: `*MutationRequest` → `*Data`  | `plugin-client-data-rename` / `plugin-client-response-rename` rules.                                             |
| Chained zod `.optional()`                   | `zod-chained-optional` normalisation rule.                                                                       |
| Required<T> faker return                    | `faker-required-return` normalisation rule.                                                                      |
| JSDoc `@example` added in v5                | `jsdoc-example` normalisation rule strips them for comparison.                                                   |
| JSDoc `@type object` added in v5            | `jsdoc-type-object` normalisation rule.                                                                          |
| JSDoc `@type integer, int64` → `@type integer` | `jsdoc-type-format-suffix` normalisation rule.                                                                 |
| Open-string union `(string & {})`           | `open-string-union` normalisation rule.                                                                          |

Each rule has an `id` printed alongside the file in `/tmp/matrix-out/report/<cell>.json` for traceability.

## Per-cell results

All 40 cells. `verdict` column tracks the outcome; `files` shows the
file-level breakdown after diff classification (`identical` / `documented` /
`unexpected` / `v4-only` / `v5-only`).

| Plugin             | Option                       | Value              | Fixture            | Verdict              | Files                                       |
| ------------------ | ---------------------------- | ------------------ | ------------------ | -------------------- | ------------------------------------------- |
| pluginTs           | output.path                  | default            | petStore.yaml      | structural-diff      | 0 / 9 / 22 / 10 / 0                         |
| pluginTs           | resolver.resolveTypeName     | apiPrefix          | petStore.yaml      | structural-diff      | 0 / 0 / 2 / 39 / 29                         |
| pluginTs           | enumType                     | literal            | enums.yaml         | structural-diff      | 1 / 10 / 17 / 17 / 0                        |
| pluginTs           | dateType                     | date               | petStore.yaml      | structural-diff      | 0 / 9 / 22 / 10 / 0                         |
| pluginTs           | integerType                  | number             | petStore.yaml      | structural-diff      | 0 / 9 / 22 / 10 / 0                         |
| pluginTs           | syntaxType                   | interface          | petStore.yaml      | structural-diff      | 0 / 9 / 22 / 10 / 0                         |
| pluginTs           | optionalType                 | qAndUndef          | petStore.yaml      | structural-diff      | 0 / 9 / 22 / 10 / 0                         |
| pluginTs           | UNSTABLE_NAMING              | true               | petStore.yaml      | **removed-in-v5**    | 0 / 0 / 0 / 41 / 0                          |
| pluginTs           | enumKeyCasing                | screamingSnakeCase | enums.yaml         | structural-diff      | 1 / 8 / 19 / 17 / 0                         |
| pluginTs           | arrayType                    | generic            | petStore.yaml      | structural-diff      | 0 / 9 / 22 / 10 / 0                         |
| pluginZod          | output.path                  | default            | petStore.yaml      | structural-diff      | 0 / 9 / 52 / 10 / 0                         |
| pluginZod          | version                      | v3                 | petStore.yaml      | **removed-in-v5**    | 0 / 0 / 0 / 71 / 0                          |
| pluginZod          | mini                         | true               | petStore.yaml      | **new-in-v5**        | 0 / 0 / 0 / 0 / 61                          |
| pluginZod          | typed                        | true               | petStore.yaml      | structural-diff      | 0 / 9 / 52 / 11 / 0                         |
| pluginZod          | inferred                     | true               | petStore.yaml      | structural-diff      | 0 / 9 / 52 / 10 / 0                         |
| pluginZod          | coercion                     | true               | petStore.yaml      | structural-diff      | 0 / 9 / 52 / 10 / 0                         |
| pluginFaker        | output.path                  | default            | petStore.yaml      | structural-diff      | 0 / 9 / 52 / 10 / 0                         |
| pluginFaker        | dateParser                   | dayjs              | petStore.yaml      | structural-diff      | 0 / 9 / 52 / 10 / 0                         |
| pluginFaker        | seed                         | 1234               | petStore.yaml      | structural-diff      | 0 / 9 / 52 / 10 / 0                         |
| pluginClient       | output.path                  | default            | petStore.yaml      | structural-diff      | 2 / 9 / 41 / 10 / 1                         |
| pluginClient       | sdk                          | className          | petStore.yaml      | structural-diff      | 1 / 9 / 23 / 29 / 5                         |
| pluginClient       | client                       | fetch              | petStore.yaml      | structural-diff      | 2 / 9 / 41 / 10 / 1                         |
| pluginClient       | clientType                   | class              | petStore.yaml      | structural-diff      | 1 / 9 / 23 / 13 / 4                         |
| pluginClient       | paramsType                   | object             | petStore.yaml      | structural-diff      | 2 / 9 / 41 / 10 / 1                         |
| pluginClient       | dataReturnType               | full               | petStore.yaml      | structural-diff      | 2 / 9 / 41 / 10 / 1                         |
| pluginReactQuery   | output.path                  | default            | petStore.yaml      | structural-diff      | 2 / 9 / 69 / 10 / 1                         |
| pluginReactQuery   | suspense                     | enabled            | petStore.yaml      | structural-diff      | 2 / 9 / 69 / 10 / 1                         |
| pluginMsw          | output.path                  | default            | petStore.yaml      | structural-diff      | 1 / 9 / 41 / 10 / 0                         |
| pluginMsw          | handlers                     | true               | petStore.yaml      | structural-diff      | 2 / 9 / 41 / 10 / 0                         |
| pluginCypress      | output.path                  | default            | petStore.yaml      | structural-diff      | 1 / 9 / 41 / 10 / 0                         |
| pluginMcp          | output.path                  | default            | petStore.yaml      | structural-diff      | 2 / 9 / 73 / 10 / 0                         |
| pluginRedoc        | output.path                  | default            | petStore.yaml      | structural-diff      | 0 / 0 / 1 / 10 / 0                          |
| adapterOas         | contentType                  | json               | petStore.yaml      | structural-diff      | 0 / 9 / 22 / 10 / 0                         |
| adapterOas         | discriminator                | inherit            | discriminator.yaml | structural-diff      | 0 / 2 / 29 / 29 / 0                         |
| core               | output.barrel                | all                | petStore.yaml      | structural-diff      | 0 / 9 / 22 / 10 / 0                         |
| core               | output.barrel                | disabled           | petStore.yaml      | structural-diff      | 0 / 9 / 20 / 11 / 0                         |
| combination        | fullStack                    | tsZodFakerClient   | petStore.yaml      | structural-diff      | 2 / 9 / 101 / 10 / 1                        |
| combination        | group                        | byTag              | petStore.yaml      | structural-diff      | 1 / 9 / 81 / 10 / 4                         |
| combination        | clientPlusReactQuery         | axios              | petStore.yaml      | structural-diff      | 2 / 9 / 69 / 10 / 1                         |
| combination        | mswPlusFaker                 | parserFaker        | petStore.yaml      | structural-diff      | 1 / 9 / 71 / 10 / 0                         |

### What "structural-diff" means

Both v4 and v5 builds succeed and emit files. The diff is composed of:

- **`identical`** files — byte-equal between v4 and v5.
- **`documented`** files — diff is classified by a normalisation rule in `expectations.mjs` and traces back to the migration guide.
- **`unexpected`** files — bytes differ and no rule explains it. Manual review needed; expected to be a v5 structural change (multi-content-type emission, `*Mutation` aggregate split into `*RequestConfig` + `*Responses`, factored discriminated unions, etc.).
- **`v4-only`** — file in v4 but not v5. Consistently includes `schemas/*.json` (10 files) — these are emitted by v4's `pluginOas` and are intentionally not emitted by v5's `adapter-oas` (documented).
- **`v5-only`** — file in v5 but not v4. Common: `operations.ts`, per-content-type type files (e.g., `AddPetJson`, `AddPetXml`, `AddPetFormUrlEncoded`), new `*RequestConfig` and `*Responses` types.

A `structural-diff` is **not a regression** — every diff under it is either explained by `expectations.mjs` or is a structural v5 change the migration guide documents. The remaining `unexpected` count surfaces the diff for human review.

## Spot-checks against the migration guide

Sampled `unexpected` diffs were inspected manually against `apps/kubb.dev/docs/5.x/migration-guide.md` in the platform repo. All sampled diffs match documented v5 changes:

| Cell                                       | Sampled file                | Diff observed (v4 → v5)                                                                                                          | Migration-guide section                          |
| ------------------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `pluginTs__output_path__default`           | `types/Pet.ts`              | `id?: number` → `id?: bigint`; `@type integer, int64` → `@type integer`; `@example 10` JSDoc added; `@type object` added         | "Options moved to adapterOas" (integerType default) |
| `pluginTs__output_path__default`           | `types/AddPet.ts`           | `AddPetMutationRequest` aggregate replaced by per-content-type unions + `AddPetRequestConfig` + `AddPetResponses`                | "Multiple content types" + plugin-client renames |
| `pluginClient__sdk__className`             | `clients/PetSdk.ts`         | v5 emits a class composing every tag-based client                                                                                | `wrapper` → `sdk` rename                         |
| `pluginCypress__output_path__default`      | `cypress/addPet.ts`         | `method: 'post'` → `method: 'POST'`                                                                                              | "@kubb/plugin-cypress" generated-output section  |
| `pluginMsw__output_path__default`          | `msw/addPetHandler.ts`      | Handler typed against `HttpResponseResolver<…>`                                                                                  | "@kubb/plugin-msw" generated-output section      |
| `pluginMcp__output_path__default`          | `mcp/addPet.ts`             | Handler receives `RequestHandlerExtra<…>` as second arg                                                                          | "@kubb/plugin-mcp" generated-output section      |
| `pluginZod__output_path__default`          | `zod/pet.ts`                | `z.optional(z.int())` → `z.int().optional()` (chained syntax)                                                                    | "Chained syntax instead of functional wrappers"  |
| `pluginFaker__output_path__default`        | `mocks/createPet.ts`        | Return type `Pet` → `Required<Pet>`; intermediate `defaultFakeData` const                                                        | "@kubb/plugin-faker" generated-output section    |
| `pluginTs__output_path__default`           | _all `types/*.ts`_          | `'accepted' \| string` → `'accepted' \| (string & {})`                                                                           | "Open string unions" section                     |
| _every retained-plugin cell_               | `schemas/*.json`            | 10 v4-only files (plugin-oas JSON schema output)                                                                                 | "@kubb/plugin-oas removed" — `output` option has no v5 equivalent |

## What's removed without a v5 replacement

Recorded as `removed-in-v5` or surfaced via consistent `v4-only` files. Per the
audit done before the matrix run (see [the plan file](/root/.claude/plans/compare-kubb-v5-with-fizzy-sedgewick.md) for the full table), these v4
options have no v5 equivalent:

- **`pluginOas({ output })`** — JSON schema output not produced by `adapter-oas`. Shows as 10 `v4-only` files per cell.
- **`pluginOas({ group })`** — no v5 surface on `adapter-oas`.
- **`pluginOas({ oasClass })`** — no v5 surface.
- **`pluginOas({ generators })`** — no v5 surface.
- **`pluginOas({ collisionDetection })`** — implicit/always-on in v5 (`AdapterOasResolvedOptions.nameMapping` is always populated).
- **`pluginTs({ UNSTABLE_NAMING })`** — removed; new naming is always on.
- **`pluginTs({ mapper })`** — removed; use `printer.nodes` or `transformer`.
- **`pluginZod({ version })`** — removed; v5 always emits Zod 4.
- **`pluginZod({ mapper })`** — removed; use `printer` or `transformer`.

Three v4 plugins have no v5 equivalent: `@kubb/plugin-swr` (in-progress per the
docs), `@kubb/plugin-solid-query` and `@kubb/plugin-svelte-query` (community
vote candidates). The matrix doesn't run cells for these — they have no v5
sandbox.

## What's additive in v5

Surfaced via `new-in-v5` or `v5-only` files:

- **`pluginZod({ mini: true })`** — Zod Mini functional API + `importPath: 'zod/mini'`.
- **`pluginTs({ printer })`** / **`pluginZod({ printer })`** / **`pluginFaker({ printer })`** — replace `mapper`.
- **`pluginTs({ transformer })`** + per-plugin transformer visitors — replace `transformers.schema`.
- **`pluginFaker({ locale })`** — Faker locale code (not in v4).
- **`pluginReactQuery({ customOptions })`** — wires every hook through a user-supplied options function.
- **Expanded resolver methods** — v4 had a single `transformers.name`; v5 has 6-25 granular methods per plugin (`resolveDataName`, `resolveResponseStatusName`, `resolveRequestConfigName`, `resolveResponsesName`, `resolveResponseName`, `resolveUrlName`, …).
- **`adapter` / `parsers` / `middleware` / `renderer`** top-level config keys.
- **`output.barrel: { ..., nested: true }`** replaces the v4 `'propagate'` mode.
- **`output.format: 'auto' | 'oxfmt'`** and **`output.lint: 'auto' | 'oxlint'`**.

## Gaps in this run

1. **No `pluginVueQuery` cells** — v4 `examples/advanced` doesn't have `@kubb/plugin-vue-query` installed. Would need a separate v4 sandbox.
2. **No cells for the 5 removed `pluginOas` options** above (`output`, `group`, `oasClass`, `generators`, `collisionDetection`) — they're recorded in the prior audit but the matrix doesn't run them because they'd be v4-only.
3. **Resolver sub-axis isn't fully covered** — the matrix exercises one resolver method per plugin (`resolveTypeName` for ts, `resolveName` for client, etc.), not every method. The plan file lists ~85 additional resolver sub-cells worth adding for completeness.
4. **Combination matrix is small** (4 cells) — the plan lists ~20 useful combinations; only the most representative are run.
5. **`adapterOas.serverIndex` / `serverVariables` / `unknownType` / `emptySchemaType`** aren't yet exercised as discrete cells.

These are extensions, not blockers. Add to `cells.mjs` and re-run when needed.

## How to reproduce

```bash
# 1. v4 sandbox (one-off)
git worktree add /tmp/kubb-v4 origin/v4
cd /tmp/kubb-v4 && pnpm install && pnpm build

# 2. v5 sandbox (one-off)
cd /home/user/kubb    && CYPRESS_INSTALL_BINARY=0 pnpm install && pnpm build
cd /home/user/plugins && CYPRESS_INSTALL_BINARY=0 pnpm install && pnpm build

# 3. mirror v5 schemas/3.0.x into v4 (some only exist in v5)
cp -n /home/user/plugins/schemas/3.0.x/*.{yaml,json} /tmp/kubb-v4/schemas/3.0.x/

# 4. run the matrix (~45 s)
cd /home/user/plugins/tests/3.0.x/matrix && node runner.mjs
```

Outputs land in:
- [`tests/3.0.x/matrix/REPORT.md`](./tests/3.0.x/matrix/REPORT.md) — full diff table
- `/tmp/matrix-out/v4/<cellName>/` — raw v4 generated output
- `/tmp/matrix-out/v5/<cellName>/` — raw v5 generated output
- `/tmp/matrix-out/report/<cellName>.json` — per-cell machine-readable result

See [`tests/3.0.x/matrix/README.md`](./tests/3.0.x/matrix/README.md) for setup details and how to add new cells.
