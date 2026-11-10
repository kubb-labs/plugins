import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { type Config, Diagnostics, type KubbHooks, fsStorage } from 'kubb/kit'
import { parserTs } from '@kubb/parser-ts'
import { pluginZod } from '@kubb/plugin-zod'
import type { PrinterZodNodes } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

type BuildConfig = Omit<Config, 'plugins' | 'reporters'> & { plugins: unknown }

const configs: Array<{ name: string; config: BuildConfig }> = [
  ...[false, true].map((mini): { name: string; config: BuildConfig } => ({
    // OpenAPI 3.1 and 3.2 fields: conditionals, contains, property counts, exclusive bounds and response headers.
    name: mini ? 'openapiFields3_2Mini' : 'openapiFields3_2',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/openapiFields3_2.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [pluginZod({ output: { path: './zod', barrel: false }, mini, importPath: mini ? 'zod/mini' : 'zod' })],
    },
  })),
  {
    // `contentSchema: true` checks the JSON a string holds and imports the schema it refers to.
    name: 'openapiFields3_2Content',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/openapiFields3_2.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [pluginZod({ output: { path: './zod', barrel: false }, contentSchema: true })],
    },
  },
  // ─── basic ──────────────────────────────────────────────────────────────
  // ─── exclude / include ───────────────────────────────────────────────────
  {
    name: 'excludeByOperationId',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginZod({
          output: { path: './zod', barrel: false, mode: 'directory' },
          exclude: [
            { type: 'operationId', pattern: 'addPet' },
            { type: 'operationId', pattern: 'deletePet' },
          ],
        }),
      ],
    },
  },
  {
    name: 'includeByTag',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginZod({
          output: { path: './zod', barrel: false, mode: 'directory' },
          include: [{ type: 'tag', pattern: 'pet' }],
        }),
      ],
    },
  },
  // ─── group ──────────────────────────────────────────────────────────────
  {
    name: 'groupByTag',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginZod({
          output: { path: './zod', barrel: false, mode: 'directory' },
          group: { type: 'tag' },
        }),
      ],
    },
  },
  // ─── inferred ───────────────────────────────────────────────────────────
  // ─── coercion ───────────────────────────────────────────────────────────
  {
    name: 'coercion',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginZod({
          output: { path: './zod', barrel: false, mode: 'directory' },
          coercion: true,
        }),
      ],
    },
  },
  // ─── dateType ───────────────────────────────────────────────────────────
  // ─── directional printer node ─────────────────────────────────────────
  // `placeOrder` takes an `Order` by `$ref` and `Order.shipDate` is a `datetime`, so the body has
  // to resolve to `orderInputSchema` (encode) while the response keeps `orderSchema` (decode).
  {
    name: 'directionalPrinterNode',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginZod({
          output: { path: './zod', barrel: false, mode: 'directory' },
          printer: {
            nodes: {
              datetime() {
                return this.options.direction === 'encode'
                  ? 'z.instanceof(Temporal.Instant).transform((value) => value.toString())'
                  : 'z.iso.datetime().transform((value) => Temporal.Instant.from(value))'
              },
            } satisfies PrinterZodNodes,
          },
        }),
      ],
    },
  },
]

describe(`plugin-zod options ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-${name}-${Date.now()}`)
    const output = path.join(tmpDir, name)
    const { files, diagnostics } = await createKubb(
      {
        ...config,
        output: {
          ...config.output,
          path: output,
        },
      } as Config,
      {
        hooks: new Hookable<KubbHooks>(),
      },
    ).safeBuild()

    expect(files.length).toBeGreaterThan(0)
    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    for (const file of files) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginZod', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
