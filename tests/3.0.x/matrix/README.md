# Kubb v4 ↔ v5 Matrix Validation

Side-by-side validation harness that runs every plugin × option combination on
both Kubb v4 (`kubb-labs/kubb` branch `v4`, `4.37.8`) and v5 (current `main`)
and reports the diffs in their generated output.

## What it does

For each cell in [`cells.mjs`](./cells.mjs):

1. Writes a `kubb.config.mjs` for v4 syntax and one for v5 syntax into the
   respective sandbox directory.
2. Runs the build via [`_matrix-driver.mjs`](#sandboxes) in each sandbox so
   `@kubb/*` imports resolve to the right packages.
3. Walks `/tmp/matrix-out/{v4,v5}/<cellName>/` and diffs every file.
4. Classifies each file as `identical`, `expected` (matches a rule in
   [`expectations.mjs`](./expectations.mjs)), `v4-only`, `v5-only`, or
   `unexpected`.
5. Computes a cell verdict (`identical`, `documented-diff`, `structural-diff`,
   `new-in-v5`, `removed-in-v5`, `build-error`, `empty-v5`) and writes a
   per-cell JSON to `/tmp/matrix-out/report/<cellName>.json`.
6. Renders a final [`REPORT.md`](./REPORT.md) summarising every cell.

## Setup

### v4 sandbox

```bash
git worktree add /tmp/kubb-v4 origin/v4
cd /tmp/kubb-v4
pnpm install
pnpm build
```

The v4 worktree must have built `packages/*/dist` artifacts.

### v5 sandbox

Use the existing `kubb-labs/plugins` workspace. Build once if needed:

```bash
cd /home/user/kubb && CYPRESS_INSTALL_BINARY=0 pnpm install && pnpm build
cd /home/user/plugins && CYPRESS_INSTALL_BINARY=0 pnpm install && pnpm build
```

### Driver scripts

The runner spawns child Node processes inside each sandbox via two small
driver scripts:

- `/tmp/kubb-v4/examples/advanced/_matrix-driver.mjs` (calls `safeBuild` from
  v4 `@kubb/core`).
- `/home/user/plugins/examples/advanced/_matrix-driver.mjs` (calls
  `createKubb(...).safeBuild()` from v5 `@kubb/core`).

Re-create them if you wipe the sandboxes — copies live in `runner.mjs` as
constants.

### Schemas

The cells point at `/tmp/kubb-v4/schemas/3.0.x/*.yaml|json` for v4 and
`/home/user/plugins/schemas/3.0.x/*.yaml|json` for v5. The v5 plugins repo has
more fixtures than v4; mirror the missing ones into v4:

```bash
cp -n /home/user/plugins/schemas/3.0.x/*.{yaml,json} /tmp/kubb-v4/schemas/3.0.x/
```

## Run

```bash
cd /home/user/plugins/tests/3.0.x/matrix
node runner.mjs
```

Takes ~45 s on a 4-core box (40 cells × 2 builds each).

Outputs:

- `REPORT.md` — human-readable summary (this directory).
- `/tmp/matrix-out/v4/<cellName>/` — raw v4 generated output per cell.
- `/tmp/matrix-out/v5/<cellName>/` — raw v5 generated output per cell.
- `/tmp/matrix-out/report/<cellName>.json` — machine-readable per-cell result.

## Inspect a specific cell

```bash
# Diff a single file between v4 and v5 for a cell:
diff /tmp/matrix-out/v4/pluginTs__output_path__default/types/Pet.ts \
     /tmp/matrix-out/v5/pluginTs__output_path__default/types/Pet.ts

# Run the normaliser on a single file and show which rules were applied:
node _inspect.mjs pluginTs__output_path__default types/Pet.ts
```

## Adding a cell

Open [`cells.mjs`](./cells.mjs) and add an object to the `cells` array:

```js
{
  plugin: 'pluginTs',
  option: 'syntaxType',
  valueLabel: 'interface',
  fixture: 'petStore.yaml',
  configV4: v4Base({
    omitTs: true,
    imports: "import { pluginTs } from '@kubb/plugin-ts'",
    plugins: 'pluginTs({ output: { path: "types" }, syntaxType: "interface" }),',
  }),
  configV5: v5Base({ /* same shape, with v5 syntax */ }),
}
```

Use `configV4: null` for v5-only options (additive), `configV5: null` for
options removed in v5 (no replacement).

## Classification rules

`expectations.mjs` exports a list of normalisation rewrites (banner stripping,
`@example` JSDoc removal, `bigint` ↔ `number`, `*Status<code>` rename, chained
zod `.optional()`, cypress method case, etc.) — each traceable to a section of
the [migration guide](../../../docs/5.x/migration-guide.md). After
normalisation, if v4 and v5 file contents are equal, the diff is `expected`.

Rules to add when you spot a documented diff that the matrix flags as
`unexpected`:

1. Pick or invent an `id` (used in the report for traceability).
2. Return the input string with the v5-only / v4-only syntax rewritten to a
   common form.
3. Re-run the matrix and confirm the cell moves from `unexpected` to
   `expected`.

## Limitations

- The matrix does not assert byte-equivalent output. Many v4 → v5 changes are
  structural (multi-content-type emission, `*Mutation` aggregate split into
  `*RequestConfig` + `*Responses`, removed `plugin-oas` JSON schemas) and
  intentional. Such cells show `structural-diff` — the report's role is to
  surface the diff for human review, not to assert equivalence.
- Cells that exercise removed plugins (`plugin-swr`, `plugin-solid-query`,
  `plugin-svelte-query`) aren't included; they have no v5 sandbox.
- `pluginVueQuery` cells aren't included because the v4 `examples/advanced`
  sandbox doesn't have vue-query installed; add a vue-query sandbox if you
  need those cells.
