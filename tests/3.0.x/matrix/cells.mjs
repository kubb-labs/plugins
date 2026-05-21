/**
 * Plugins × options matrix. Each cell exports the full kubb.config.mjs as a
 * string for both v4 and v5. Strings are evaluated as ESM modules with the
 * right node_modules resolution in their respective sandbox dirs.
 *
 * Field shape:
 *   plugin       — adapter/plugin name (or 'combination' for cross-plugin cells)
 *   option       — the option being exercised, dot-path for nested
 *   valueLabel   — short label for the value (becomes part of the cell name)
 *   fixture      — schema path used (relative to sandbox; we copy/symlink)
 *   configV4     — full kubb.config.mjs source for v4, or null if no v4 equivalent
 *   configV5     — full kubb.config.mjs source for v5, or null if removed in v5
 *   acceptedDiffs— optional extra regex IDs to merge with default expectations
 */

// Fixture paths (the runner sandboxes use the same schemas/3.0.x petStore.yaml — content is byte-identical)
const PET_V4 = '/tmp/kubb-v4/schemas/3.0.x/petStore.yaml'
const PET_V5 = '/home/user/plugins/schemas/3.0.x/petStore.yaml'
const DISCRIM_V4 = '/tmp/kubb-v4/schemas/3.0.x/discriminator.yaml'
const DISCRIM_V5 = '/home/user/plugins/schemas/3.0.x/discriminator.yaml'
const ENUMS_V4 = '/tmp/kubb-v4/schemas/3.0.x/enums.yaml'
const ENUMS_V5 = '/home/user/plugins/schemas/3.0.x/enums.yaml'

/**
 * Most plugins (faker, msw, client, react-query, cypress, mcp) require pluginTs
 * in the plugin list because they reference generated types. The base templates
 * always include pluginTs unless `extra.omitTs` is true.
 */
const v4Base = (extra = {}) => `
import { defineConfig } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
${extra.omitTs ? '' : "import { pluginTs as _baseTs } from '@kubb/plugin-ts'"}
${extra.imports ?? ''}

export default defineConfig({
  root: '.',
  input: { path: '${extra.fixture ?? PET_V4}' },
  output: { path: './gen', clean: true, barrelType: 'named' },
  plugins: [
    pluginOas({ validate: false${extra.oasOpts ? ', ' + extra.oasOpts : ''} }),
    ${extra.omitTs ? '' : "_baseTs({ output: { path: 'types' } }),"}
    ${extra.plugins ?? ''}
  ],
})
`

const v5Base = (extra = {}) => `
import { defineConfig } from 'kubb'
import { adapterOas } from '@kubb/adapter-oas'
${extra.omitTs ? '' : "import { pluginTs as _baseTs } from '@kubb/plugin-ts'"}
${extra.imports ?? ''}

export default defineConfig({
  root: '.',
  input: { path: '${extra.fixture ?? PET_V5}' },
  output: { path: './gen', clean: true, barrel: { type: 'named' } },
  adapter: adapterOas({ validate: false${extra.adapterOpts ? ', ' + extra.adapterOpts : ''} }),
  plugins: [
    ${extra.omitTs ? '' : "_baseTs({ output: { path: 'types' } }),"}
    ${extra.plugins ?? ''}
  ],
})
`

export const cells = [
  // ─── pluginTs base ──────────────────────────────────────────────────────
  {
    plugin: 'pluginTs',
    option: 'output.path',
    valueLabel: 'default',
    fixture: 'petStore.yaml',
    configV4: v4Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" } }),' }),
    configV5: v5Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" } }),' }),
  },

  // ─── pluginTs: transformers.name → resolver.resolveTypeName ─────────────
  {
    plugin: 'pluginTs',
    option: 'resolver.resolveTypeName',
    valueLabel: 'apiPrefix',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      omitTs: true,
      imports: "import { pluginTs } from '@kubb/plugin-ts'",
      plugins: `pluginTs({ output: { path: "types" }, transformers: { name: (name) => 'Api' + name } }),`,
    }),
    configV5: v5Base({
      omitTs: true,
      imports: "import { pluginTs } from '@kubb/plugin-ts'",
      plugins: `pluginTs({
        output: { path: "types" },
        resolver: { resolveTypeName(name) { return 'Api' + this.default(name, 'function') } },
      }),`,
    }),
  },

  // ─── pluginTs: enumType literal ─────────────────────────────────────────
  {
    plugin: 'pluginTs',
    option: 'enumType',
    valueLabel: 'literal',
    fixture: 'enums.yaml',
    configV4: v4Base({ omitTs: true, fixture: ENUMS_V4, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, enumType: "literal" }),' }),
    configV5: v5Base({ omitTs: true, fixture: ENUMS_V5, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, enumType: "literal" }),' }),
  },

  // ─── pluginTs: dateType (moved to adapterOas) ───────────────────────────
  {
    plugin: 'pluginTs',
    option: 'dateType',
    valueLabel: 'date',
    fixture: 'petStore.yaml',
    configV4: v4Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, dateType: "date" }),' }),
    configV5: v5Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", adapterOpts: 'dateType: "date"', plugins: 'pluginTs({ output: { path: "types" } }),' }),
  },

  // ─── pluginTs: integerType (default changed bigint→number) ──────────────
  {
    plugin: 'pluginTs',
    option: 'integerType',
    valueLabel: 'number',
    fixture: 'petStore.yaml',
    configV4: v4Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, integerType: "number" }),' }),
    configV5: v5Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", adapterOpts: 'integerType: "number"', plugins: 'pluginTs({ output: { path: "types" } }),' }),
  },

  // ─── pluginTs: syntaxType interface ─────────────────────────────────────
  {
    plugin: 'pluginTs',
    option: 'syntaxType',
    valueLabel: 'interface',
    fixture: 'petStore.yaml',
    configV4: v4Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, syntaxType: "interface" }),' }),
    configV5: v5Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, syntaxType: "interface" }),' }),
  },

  // ─── pluginTs: optionalType questionTokenAndUndefined ───────────────────
  {
    plugin: 'pluginTs',
    option: 'optionalType',
    valueLabel: 'qAndUndef',
    fixture: 'petStore.yaml',
    configV4: v4Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, optionalType: "questionTokenAndUndefined" }),' }),
    configV5: v5Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, optionalType: "questionTokenAndUndefined" }),' }),
  },

  // ─── pluginTs: UNSTABLE_NAMING (removed in v5) ──────────────────────────
  {
    plugin: 'pluginTs',
    option: 'UNSTABLE_NAMING',
    valueLabel: 'true',
    fixture: 'petStore.yaml',
    configV4: v4Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, UNSTABLE_NAMING: true }),' }),
    configV5: null,
  },

  // ─── pluginZod base ─────────────────────────────────────────────────────
  {
    plugin: 'pluginZod',
    option: 'output.path',
    valueLabel: 'default',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginZod } from '@kubb/plugin-zod'",
      plugins: 'pluginZod({ output: { path: "zod" } }),',
    }),
    configV5: v5Base({
      imports: "import { pluginZod } from '@kubb/plugin-zod'",
      plugins: 'pluginZod({ output: { path: "zod" } }),',
    }),
  },

  // ─── pluginZod: version (removed in v5) ─────────────────────────────────
  {
    plugin: 'pluginZod',
    option: 'version',
    valueLabel: 'v3',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginZod } from '@kubb/plugin-zod'",
      plugins: 'pluginZod({ output: { path: "zod" }, version: "3" }),',
    }),
    configV5: null, // removed; always Zod 4 in v5
  },

  // ─── pluginZod: mini (additive in v5) ───────────────────────────────────
  {
    plugin: 'pluginZod',
    option: 'mini',
    valueLabel: 'true',
    fixture: 'petStore.yaml',
    configV4: null,
    configV5: v5Base({
      imports: "import { pluginZod } from '@kubb/plugin-zod'",
      plugins: 'pluginZod({ output: { path: "zod" }, mini: true }),',
    }),
  },

  // ─── pluginFaker base ───────────────────────────────────────────────────
  {
    plugin: 'pluginFaker',
    option: 'output.path',
    valueLabel: 'default',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginFaker } from '@kubb/plugin-faker'",
      plugins: 'pluginFaker({ output: { path: "mocks" } }),',
    }),
    configV5: v5Base({
      imports: "import { pluginFaker } from '@kubb/plugin-faker'",
      plugins: 'pluginFaker({ output: { path: "mocks" } }),',
    }),
  },

  // ─── pluginClient base ──────────────────────────────────────────────────
  {
    plugin: 'pluginClient',
    option: 'output.path',
    valueLabel: 'default',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginClient } from '@kubb/plugin-client'",
      plugins: 'pluginClient({ output: { path: "clients" }, client: "axios" }),',
    }),
    configV5: v5Base({
      imports: "import { pluginClient } from '@kubb/plugin-client'",
      plugins: 'pluginClient({ output: { path: "clients" }, client: "axios" }),',
    }),
  },

  // ─── pluginClient: wrapper → sdk ────────────────────────────────────────
  {
    plugin: 'pluginClient',
    option: 'sdk',
    valueLabel: 'className',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginClient } from '@kubb/plugin-client'",
      plugins: 'pluginClient({ output: { path: "clients" }, client: "axios", wrapper: { className: "PetSdk" } }),',
    }),
    configV5: v5Base({
      imports: "import { pluginClient } from '@kubb/plugin-client'",
      plugins: 'pluginClient({ output: { path: "clients" }, client: "axios", sdk: { className: "PetSdk" } }),',
    }),
  },

  // ─── pluginClient: fetch ────────────────────────────────────────────────
  {
    plugin: 'pluginClient',
    option: 'client',
    valueLabel: 'fetch',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginClient } from '@kubb/plugin-client'",
      plugins: 'pluginClient({ output: { path: "clients" }, client: "fetch" }),',
    }),
    configV5: v5Base({
      imports: "import { pluginClient } from '@kubb/plugin-client'",
      plugins: 'pluginClient({ output: { path: "clients" }, client: "fetch" }),',
    }),
  },

  // ─── pluginReactQuery base ──────────────────────────────────────────────
  {
    plugin: 'pluginReactQuery',
    option: 'output.path',
    valueLabel: 'default',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: `import { pluginClient } from '@kubb/plugin-client'\nimport { pluginReactQuery } from '@kubb/plugin-react-query'`,
      plugins: 'pluginClient({ output: { path: "clients" }, client: "axios" }), pluginReactQuery({ output: { path: "hooks" } }),',
    }),
    configV5: v5Base({
      imports: `import { pluginClient } from '@kubb/plugin-client'\nimport { pluginReactQuery } from '@kubb/plugin-react-query'`,
      plugins: 'pluginClient({ output: { path: "clients" }, client: "axios" }), pluginReactQuery({ output: { path: "hooks" } }),',
    }),
  },

  // ─── pluginMsw base ─────────────────────────────────────────────────────
  {
    plugin: 'pluginMsw',
    option: 'output.path',
    valueLabel: 'default',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginMsw } from '@kubb/plugin-msw'",
      plugins: 'pluginMsw({ output: { path: "msw" } }),',
    }),
    configV5: v5Base({
      imports: "import { pluginMsw } from '@kubb/plugin-msw'",
      plugins: 'pluginMsw({ output: { path: "msw" } }),',
    }),
  },

  // ─── pluginCypress base ─────────────────────────────────────────────────
  {
    plugin: 'pluginCypress',
    option: 'output.path',
    valueLabel: 'default',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginCypress } from '@kubb/plugin-cypress'",
      plugins: 'pluginCypress({ output: { path: "cypress" } }),',
    }),
    configV5: v5Base({
      imports: "import { pluginCypress } from '@kubb/plugin-cypress'",
      plugins: 'pluginCypress({ output: { path: "cypress" } }),',
    }),
  },

  // ─── adapter-oas: contentType (moved from per-plugin) ───────────────────
  {
    plugin: 'adapterOas',
    option: 'contentType',
    valueLabel: 'json',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginTs } from '@kubb/plugin-ts'",
      plugins: 'pluginTs({ output: { path: "types" }, contentType: "application/json" }),',
    }),
    configV5: v5Base({
      imports: "import { pluginTs } from '@kubb/plugin-ts'",
      adapterOpts: 'contentType: "application/json"',
      plugins: 'pluginTs({ output: { path: "types" } }),',
    }),
  },

  // ─── adapter-oas: discriminator inherit ─────────────────────────────────
  {
    plugin: 'adapterOas',
    option: 'discriminator',
    valueLabel: 'inherit',
    fixture: 'discriminator.yaml',
    configV4: v4Base({
      fixture: DISCRIM_V4,
      imports: "import { pluginTs } from '@kubb/plugin-ts'",
      plugins: 'pluginTs({ output: { path: "types" } }),',
    }).replace('pluginOas({ validate: false })', 'pluginOas({ validate: false, discriminator: "inherit" })'),
    configV5: v5Base({
      fixture: DISCRIM_V5,
      imports: "import { pluginTs } from '@kubb/plugin-ts'",
      adapterOpts: 'discriminator: "inherit"',
      plugins: 'pluginTs({ output: { path: "types" } }),',
    }),
  },

  // ─── output.barrelType → output.barrel ──────────────────────────────────
  {
    plugin: 'core',
    option: 'output.barrel',
    valueLabel: 'all',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginTs } from '@kubb/plugin-ts'",
      plugins: 'pluginTs({ output: { path: "types" } }),',
    }).replace("barrelType: 'named'", "barrelType: 'all'"),
    configV5: v5Base({
      imports: "import { pluginTs } from '@kubb/plugin-ts'",
      plugins: 'pluginTs({ output: { path: "types" } }),',
    }).replace("barrel: { type: 'named' }", "barrel: { type: 'all' }"),
  },

  // ─── output.barrelType: false → output.barrel: false ────────────────────
  {
    plugin: 'core',
    option: 'output.barrel',
    valueLabel: 'disabled',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginTs } from '@kubb/plugin-ts'",
      plugins: 'pluginTs({ output: { path: "types" } }),',
    }).replace("barrelType: 'named'", 'barrelType: false'),
    configV5: v5Base({
      imports: "import { pluginTs } from '@kubb/plugin-ts'",
      plugins: 'pluginTs({ output: { path: "types" } }),',
    }).replace("barrel: { type: 'named' }", 'barrel: false'),
  },

  // ─── pluginTs: enumKeyCasing ────────────────────────────────────────────
  {
    plugin: 'pluginTs',
    option: 'enumKeyCasing',
    valueLabel: 'screamingSnakeCase',
    fixture: 'enums.yaml',
    configV4: v4Base({ omitTs: true, fixture: ENUMS_V4, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, enumKeyCasing: "screamingSnakeCase" }),' }),
    configV5: v5Base({ omitTs: true, fixture: ENUMS_V5, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, enumKeyCasing: "screamingSnakeCase" }),' }),
  },

  // ─── pluginTs: arrayType generic ────────────────────────────────────────
  {
    plugin: 'pluginTs',
    option: 'arrayType',
    valueLabel: 'generic',
    fixture: 'petStore.yaml',
    configV4: v4Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, arrayType: "generic" }),' }),
    configV5: v5Base({ omitTs: true, imports: "import { pluginTs } from '@kubb/plugin-ts'", plugins: 'pluginTs({ output: { path: "types" }, arrayType: "generic" }),' }),
  },

  // ─── pluginZod: typed (tie to plugin-ts) ────────────────────────────────
  {
    plugin: 'pluginZod',
    option: 'typed',
    valueLabel: 'true',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: "import { pluginZod } from '@kubb/plugin-zod'",
      plugins: 'pluginZod({ output: { path: "zod" }, typed: true }),',
    }),
    configV5: v5Base({
      imports: "import { pluginZod } from '@kubb/plugin-zod'",
      plugins: 'pluginZod({ output: { path: "zod" }, typed: true }),',
    }),
  },

  // ─── pluginZod: inferred ────────────────────────────────────────────────
  {
    plugin: 'pluginZod',
    option: 'inferred',
    valueLabel: 'true',
    fixture: 'petStore.yaml',
    configV4: v4Base({ imports: "import { pluginZod } from '@kubb/plugin-zod'", plugins: 'pluginZod({ output: { path: "zod" }, inferred: true }),' }),
    configV5: v5Base({ imports: "import { pluginZod } from '@kubb/plugin-zod'", plugins: 'pluginZod({ output: { path: "zod" }, inferred: true }),' }),
  },

  // ─── pluginZod: coercion ────────────────────────────────────────────────
  {
    plugin: 'pluginZod',
    option: 'coercion',
    valueLabel: 'true',
    fixture: 'petStore.yaml',
    configV4: v4Base({ imports: "import { pluginZod } from '@kubb/plugin-zod'", plugins: 'pluginZod({ output: { path: "zod" }, coercion: true }),' }),
    configV5: v5Base({ imports: "import { pluginZod } from '@kubb/plugin-zod'", plugins: 'pluginZod({ output: { path: "zod" }, coercion: true }),' }),
  },

  // ─── pluginFaker: dateParser dayjs ──────────────────────────────────────
  {
    plugin: 'pluginFaker',
    option: 'dateParser',
    valueLabel: 'dayjs',
    fixture: 'petStore.yaml',
    configV4: v4Base({ imports: "import { pluginFaker } from '@kubb/plugin-faker'", plugins: 'pluginFaker({ output: { path: "mocks" }, dateParser: "dayjs" }),' }),
    configV5: v5Base({ imports: "import { pluginFaker } from '@kubb/plugin-faker'", plugins: 'pluginFaker({ output: { path: "mocks" }, dateParser: "dayjs" }),' }),
  },

  // ─── pluginFaker: seed ──────────────────────────────────────────────────
  {
    plugin: 'pluginFaker',
    option: 'seed',
    valueLabel: '1234',
    fixture: 'petStore.yaml',
    configV4: v4Base({ imports: "import { pluginFaker } from '@kubb/plugin-faker'", plugins: 'pluginFaker({ output: { path: "mocks" }, seed: 1234 }),' }),
    configV5: v5Base({ imports: "import { pluginFaker } from '@kubb/plugin-faker'", plugins: 'pluginFaker({ output: { path: "mocks" }, seed: 1234 }),' }),
  },

  // ─── pluginClient: clientType class ─────────────────────────────────────
  {
    plugin: 'pluginClient',
    option: 'clientType',
    valueLabel: 'class',
    fixture: 'petStore.yaml',
    configV4: v4Base({ imports: "import { pluginClient } from '@kubb/plugin-client'", plugins: 'pluginClient({ output: { path: "clients" }, client: "axios", clientType: "class" }),' }),
    configV5: v5Base({ imports: "import { pluginClient } from '@kubb/plugin-client'", plugins: 'pluginClient({ output: { path: "clients" }, client: "axios", clientType: "class" }),' }),
  },

  // ─── pluginClient: paramsType object ────────────────────────────────────
  {
    plugin: 'pluginClient',
    option: 'paramsType',
    valueLabel: 'object',
    fixture: 'petStore.yaml',
    configV4: v4Base({ imports: "import { pluginClient } from '@kubb/plugin-client'", plugins: 'pluginClient({ output: { path: "clients" }, client: "axios", paramsType: "object" }),' }),
    configV5: v5Base({ imports: "import { pluginClient } from '@kubb/plugin-client'", plugins: 'pluginClient({ output: { path: "clients" }, client: "axios", paramsType: "object" }),' }),
  },

  // ─── pluginClient: dataReturnType full ──────────────────────────────────
  {
    plugin: 'pluginClient',
    option: 'dataReturnType',
    valueLabel: 'full',
    fixture: 'petStore.yaml',
    configV4: v4Base({ imports: "import { pluginClient } from '@kubb/plugin-client'", plugins: 'pluginClient({ output: { path: "clients" }, client: "axios", dataReturnType: "full" }),' }),
    configV5: v5Base({ imports: "import { pluginClient } from '@kubb/plugin-client'", plugins: 'pluginClient({ output: { path: "clients" }, client: "axios", dataReturnType: "full" }),' }),
  },

  // ─── pluginReactQuery: suspense ─────────────────────────────────────────
  {
    plugin: 'pluginReactQuery',
    option: 'suspense',
    valueLabel: 'enabled',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: `import { pluginClient } from '@kubb/plugin-client'\nimport { pluginReactQuery } from '@kubb/plugin-react-query'`,
      plugins: 'pluginClient({ output: { path: "clients" }, client: "axios" }), pluginReactQuery({ output: { path: "hooks" }, suspense: {} }),',
    }),
    configV5: v5Base({
      imports: `import { pluginClient } from '@kubb/plugin-client'\nimport { pluginReactQuery } from '@kubb/plugin-react-query'`,
      plugins: 'pluginClient({ output: { path: "clients" }, client: "axios" }), pluginReactQuery({ output: { path: "hooks" }, suspense: {} }),',
    }),
  },

  // ─── pluginMsw: handlers ────────────────────────────────────────────────
  {
    plugin: 'pluginMsw',
    option: 'handlers',
    valueLabel: 'true',
    fixture: 'petStore.yaml',
    configV4: v4Base({ imports: "import { pluginMsw } from '@kubb/plugin-msw'", plugins: 'pluginMsw({ output: { path: "msw" }, handlers: true }),' }),
    configV5: v5Base({ imports: "import { pluginMsw } from '@kubb/plugin-msw'", plugins: 'pluginMsw({ output: { path: "msw" }, handlers: true }),' }),
  },

  // ─── pluginMcp base (requires pluginZod) ────────────────────────────────
  {
    plugin: 'pluginMcp',
    option: 'output.path',
    valueLabel: 'default',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: `import { pluginMcp } from '@kubb/plugin-mcp'\nimport { pluginZod } from '@kubb/plugin-zod'`,
      plugins: `pluginZod({ output: { path: 'zod' } }), pluginMcp({ output: { path: 'mcp' } }),`,
    }),
    configV5: v5Base({
      imports: `import { pluginMcp } from '@kubb/plugin-mcp'\nimport { pluginZod } from '@kubb/plugin-zod'`,
      plugins: `pluginZod({ output: { path: 'zod' } }), pluginMcp({ output: { path: 'mcp' } }),`,
    }),
  },

  // ─── pluginRedoc base ───────────────────────────────────────────────────
  {
    plugin: 'pluginRedoc',
    option: 'output.path',
    valueLabel: 'default',
    fixture: 'petStore.yaml',
    configV4: v4Base({ omitTs: true, imports: "import { pluginRedoc } from '@kubb/plugin-redoc'", plugins: 'pluginRedoc({ output: { path: "docs.html" } }),' }),
    configV5: v5Base({ omitTs: true, imports: "import { pluginRedoc } from '@kubb/plugin-redoc'", plugins: 'pluginRedoc({ output: { path: "docs.html" } }),' }),
  },

  // ─── Combination: fullStack ─────────────────────────────────────────────
  {
    plugin: 'combination',
    option: 'fullStack',
    valueLabel: 'tsZodFakerClient',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      omitTs: true,
      imports: `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'\nimport { pluginFaker } from '@kubb/plugin-faker'\nimport { pluginClient } from '@kubb/plugin-client'`,
      plugins: `pluginTs({ output: { path: 'types' } }),
        pluginZod({ output: { path: 'zod' } }),
        pluginFaker({ output: { path: 'mocks' } }),
        pluginClient({ output: { path: 'clients' }, client: 'axios' }),`,
    }),
    configV5: v5Base({
      omitTs: true,
      imports: `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'\nimport { pluginFaker } from '@kubb/plugin-faker'\nimport { pluginClient } from '@kubb/plugin-client'`,
      plugins: `pluginTs({ output: { path: 'types' } }),
        pluginZod({ output: { path: 'zod' } }),
        pluginFaker({ output: { path: 'mocks' } }),
        pluginClient({ output: { path: 'clients' }, client: 'axios' }),`,
    }),
  },

  // ─── Combination: groupedByTag ──────────────────────────────────────────
  {
    plugin: 'combination',
    option: 'group',
    valueLabel: 'byTag',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      omitTs: true,
      imports: `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'\nimport { pluginClient } from '@kubb/plugin-client'`,
      plugins: `pluginTs({ output: { path: 'types' }, group: { type: 'tag' } }),
        pluginZod({ output: { path: 'zod' }, group: { type: 'tag' } }),
        pluginClient({ output: { path: 'clients' }, client: 'axios', group: { type: 'tag' } }),`,
    }),
    configV5: v5Base({
      omitTs: true,
      imports: `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginZod } from '@kubb/plugin-zod'\nimport { pluginClient } from '@kubb/plugin-client'`,
      plugins: `pluginTs({ output: { path: 'types' }, group: { type: 'tag' } }),
        pluginZod({ output: { path: 'zod' }, group: { type: 'tag' } }),
        pluginClient({ output: { path: 'clients' }, client: 'axios', group: { type: 'tag' } }),`,
    }),
  },

  // ─── Combination: clientPlusReactQuery ──────────────────────────────────
  {
    plugin: 'combination',
    option: 'clientPlusReactQuery',
    valueLabel: 'axios',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      omitTs: true,
      imports: `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginClient } from '@kubb/plugin-client'\nimport { pluginReactQuery } from '@kubb/plugin-react-query'`,
      plugins: `pluginTs({ output: { path: 'types' } }),
        pluginClient({ output: { path: 'clients' }, client: 'axios' }),
        pluginReactQuery({ output: { path: 'hooks' } }),`,
    }),
    configV5: v5Base({
      omitTs: true,
      imports: `import { pluginTs } from '@kubb/plugin-ts'\nimport { pluginClient } from '@kubb/plugin-client'\nimport { pluginReactQuery } from '@kubb/plugin-react-query'`,
      plugins: `pluginTs({ output: { path: 'types' } }),
        pluginClient({ output: { path: 'clients' }, client: 'axios' }),
        pluginReactQuery({ output: { path: 'hooks' } }),`,
    }),
  },

  // ─── Combination: mswPlusFaker ──────────────────────────────────────────
  {
    plugin: 'combination',
    option: 'mswPlusFaker',
    valueLabel: 'parserFaker',
    fixture: 'petStore.yaml',
    configV4: v4Base({
      imports: `import { pluginMsw } from '@kubb/plugin-msw'\nimport { pluginFaker } from '@kubb/plugin-faker'`,
      plugins: `pluginFaker({ output: { path: 'mocks' } }),
        pluginMsw({ output: { path: 'msw' }, parser: 'faker' }),`,
    }),
    configV5: v5Base({
      imports: `import { pluginMsw } from '@kubb/plugin-msw'\nimport { pluginFaker } from '@kubb/plugin-faker'`,
      plugins: `pluginFaker({ output: { path: 'mocks' } }),
        pluginMsw({ output: { path: 'msw' }, parser: 'faker' }),`,
    }),
  },
]
