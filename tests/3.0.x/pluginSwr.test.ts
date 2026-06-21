import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, type Config, createKubb, Diagnostics, fsStorage, type KubbHooks } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

type BuildConfig = Omit<Config, 'plugins' | 'storage' | 'reporters'> & { plugins: unknown }

const configs: Array<{ name: string; config: BuildConfig }> = [
  // ─── basic ──────────────────────────────────────────────────────────────
  {
    name: 'petStore',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginSwr({
          output: { path: './hooks', barrel: false },
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
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginZod({ output: { path: './zod', barrel: false } }),
        pluginSwr({
          output: { path: './hooks', barrel: false },
          parser: 'zod',
        }),
      ],
    },
  },

  // ─── query / mutation methods override ──────────────────────────────────
  {
    name: 'queryMethods',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginSwr({
          output: { path: './hooks', barrel: false },
          query: {
            methods: ['get'],
            importPath: 'swr',
          },
          mutation: {
            methods: ['post', 'put', 'patch', 'delete'],
          },
        }),
      ],
    },
  },

  // ─── query disabled ─────────────────────────────────────────────────────
  {
    name: 'queryDisabled',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginSwr({
          output: { path: './hooks', barrel: false },
          query: false,
        }),
      ],
    },
  },

  // ─── mutation disabled ──────────────────────────────────────────────────
  {
    name: 'mutationDisabled',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginSwr({
          output: { path: './hooks', barrel: false },
          mutation: false,
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
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginSwr({
          output: { path: './hooks', barrel: false },
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
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginSwr({
          output: { path: './hooks', barrel: false },
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
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginSwr({
          output: { path: './hooks', barrel: false },
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
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginSwr({
          output: { path: './hooks', barrel: false },
          group: { type: 'tag' },
        }),
      ],
    },
  },

  // ─── with explicit client plugin ───────────────────────────────────────
  {
    name: 'withClientPlugin',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginAxios({ output: { path: './clients', barrel: false } }),
        pluginSwr({
          output: { path: './hooks', barrel: false },
        }),
      ],
    },
  },
]

describe(`plugin-swr options ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-${name}-${Date.now()}`)
    const output = path.join(tmpDir, name)
    const { files, diagnostics } = await createKubb(
      {
        ...config,
        storage: fsStorage(),
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
      try {
        const fileContent = await fs.readFile(file.path, 'utf-8')
        await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginSwr', name, getRelativePath(output, file.path)))
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
