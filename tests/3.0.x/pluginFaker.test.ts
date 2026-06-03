import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, type Config, createKubb, Diagnostics, type KubbHooks, fsStorage } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

type BuildConfig = Omit<Config, 'plugins' | 'reporters'> & { plugins: unknown }

const configs: Array<{ name: string; config: BuildConfig }> = [
  // ─── basic ──────────────────────────────────────────────────────────────
  {
    name: 'petStore',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFaker({
          output: { path: './faker', barrel: false },
        }),
      ],
    },
  },

  // ─── locale ─────────────────────────────────────────────────────────────
  {
    name: 'locale',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFaker({
          output: { path: './faker', barrel: false },
          locale: 'de',
        }),
      ],
    },
  },

  // ─── seed ───────────────────────────────────────────────────────────────
  {
    name: 'seed',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFaker({
          output: { path: './faker', barrel: false },
          seed: [42],
        }),
      ],
    },
  },

  // ─── mapper ─────────────────────────────────────────────────────────────
  {
    name: 'mapper',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFaker({
          output: { path: './faker', barrel: false },
          mapper: {
            status: "'active'",
          },
        }),
      ],
    },
  },

  // ─── dateParser ─────────────────────────────────────────────────────────
  {
    name: 'dateParserDayjs',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFaker({
          output: { path: './faker', barrel: false },
          dateParser: 'dayjs',
        }),
      ],
    },
  },

  // ─── regexGenerator ─────────────────────────────────────────────────────
  {
    name: 'regexGeneratorRandexp',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFaker({
          output: { path: './faker', barrel: false },
          regexGenerator: 'randexp',
        }),
      ],
    },
  },

  // ─── paramsCasing ───────────────────────────────────────────────────────
  {
    name: 'paramsCasing',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/paramsCasing.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFaker({
          output: { path: './faker', barrel: false },
          paramsCasing: 'camelcase',
        }),
      ],
    },
  },

  // ─── exclude / include ─────────────────────────────────────────────────
  {
    name: 'excludeByOperationId',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFaker({
          output: { path: './faker', barrel: false },
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
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFaker({
          output: { path: './faker', barrel: false },
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
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFaker({
          output: { path: './faker', barrel: false },
          group: { type: 'tag' },
        }),
      ],
    },
  },
]

describe(`plugin-faker options ${version}`, () => {
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
        hooks: new AsyncEventEmitter<KubbHooks>(),
      },
    ).safeBuild()

    expect(files.length).toBeGreaterThan(0)
    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    for (const file of files) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginFaker', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
