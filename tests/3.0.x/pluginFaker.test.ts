import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, type Config, createKubb, type KubbHooks } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

type BuildConfig = Omit<Config, 'plugins'> & { plugins: unknown }

const configs: Array<{ name: string; config: BuildConfig }> = [
  // ─── basic ──────────────────────────────────────────────────────────────
  {
    name: 'petStore',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginFaker({
          output: { path: './faker', barrelType: false },
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
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginFaker({
          output: { path: './faker', barrelType: false },
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
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginFaker({
          output: { path: './faker', barrelType: false },
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
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginFaker({
          output: { path: './faker', barrelType: false },
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
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginFaker({
          output: { path: './faker', barrelType: false },
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
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginFaker({
          output: { path: './faker', barrelType: false },
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
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginFaker({
          output: { path: './faker', barrelType: false },
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
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginFaker({
          output: { path: './faker', barrelType: false },
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
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginFaker({
          output: { path: './faker', barrelType: false },
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
    const { files, failedPlugins, error } = await createKubb(
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
    expect(failedPlugins.size).toBe(0)
    expect(error).toBeUndefined()

    for (const file of files) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginFaker', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
