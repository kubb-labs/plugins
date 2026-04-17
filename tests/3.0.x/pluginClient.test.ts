import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, type Config, createKubb, type KubbHooks } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
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
        pluginClient({
          output: { path: './clients', barrelType: false },
        }),
      ],
    },
  },

  // ─── dataReturnType ─────────────────────────────────────────────────────
  {
    name: 'dataReturnTypeFull',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginClient({
          output: { path: './clients', barrelType: false },
          dataReturnType: 'full',
        }),
      ],
    },
  },

  // ─── paramsType ─────────────────────────────────────────────────────────
  {
    name: 'paramsTypeObject',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginClient({
          output: { path: './clients', barrelType: false },
          paramsType: 'object',
        }),
      ],
    },
  },

  // ─── pathParamsType ─────────────────────────────────────────────────────
  {
    name: 'pathParamsTypeObject',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginClient({
          output: { path: './clients', barrelType: false },
          pathParamsType: 'object',
        }),
      ],
    },
  },

  // ─── operations ─────────────────────────────────────────────────────────
  {
    name: 'operations',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginClient({
          output: { path: './clients', barrelType: false },
          operations: true,
        }),
      ],
    },
  },

  // ─── parser zod ─────────────────────────────────────────────────────────
  {
    name: 'parserZod',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginZod({ output: { path: './zod', barrelType: false } }),
        pluginClient({
          output: { path: './clients', barrelType: false },
          parser: 'zod',
        }),
      ],
    },
  },

  // ─── clientType ─────────────────────────────────────────────────────────
  {
    name: 'clientTypeClass',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginClient({
          output: { path: './clients', barrelType: false },
          clientType: 'class',
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
        pluginClient({
          output: { path: './clients', barrelType: false },
          paramsCasing: 'camelcase',
        }),
      ],
    },
  },

  // ─── baseURL ────────────────────────────────────────────────────────────
  {
    name: 'baseURL',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrelType: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrelType: false } }),
        pluginClient({
          output: { path: './clients', barrelType: false },
          baseURL: 'https://api.example.com/v1',
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
        pluginClient({
          output: { path: './clients', barrelType: false },
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
        pluginClient({
          output: { path: './clients', barrelType: false },
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
        pluginClient({
          output: { path: './clients', barrelType: false },
          group: { type: 'tag' },
        }),
      ],
    },
  },
]

describe(`plugin-client options ${version}`, () => {
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
      try {
        const fileContent = await fs.readFile(file.path, 'utf-8')
        await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginClient', name, getRelativePath(output, file.path)))
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
