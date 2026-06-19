import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, type Config, createKubb, Diagnostics, type KubbHooks, fsStorage } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginClient } from '@kubb/plugin-client'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import { pluginZod } from '@kubb/plugin-zod'
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
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginVueQuery({
          output: { path: './hooks', barrel: false },
          client: { importPath: '@kubb/plugin-client/clients/axios' },
        }),
      ],
    },
  },

  // ─── infinite ───────────────────────────────────────────────────────────
  {
    name: 'infinite',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginVueQuery({
          output: { path: './hooks', barrel: false },
          client: { importPath: '@kubb/plugin-client/clients/axios' },
          infinite: {
            queryParam: 'page',
            initialPageParam: 0,
          },
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
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginZod({ output: { path: './zod', barrel: false } }),
        pluginVueQuery({
          output: { path: './hooks', barrel: false },
          client: { importPath: '@kubb/plugin-client/clients/axios' },
          parser: 'zod',
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
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginVueQuery({
          output: { path: './hooks', barrel: false },
          client: { importPath: '@kubb/plugin-client/clients/axios' },
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
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginVueQuery({
          output: { path: './hooks', barrel: false },
          client: { importPath: '@kubb/plugin-client/clients/axios' },
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
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginVueQuery({
          output: { path: './hooks', barrel: false },
          client: { importPath: '@kubb/plugin-client/clients/axios' },
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
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginVueQuery({
          output: { path: './hooks', barrel: false },
          client: { importPath: '@kubb/plugin-client/clients/axios' },
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
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginVueQuery({
          output: { path: './hooks', barrel: false },
          client: { importPath: '@kubb/plugin-client/clients/axios' },
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
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({ output: { path: './clients', barrel: false }, importPath: '@kubb/plugin-client/clients/axios' }),
        pluginVueQuery({
          output: { path: './hooks', barrel: false },
          client: { importPath: '@kubb/plugin-client/clients/axios' },
        }),
      ],
    },
  },
]

describe(`plugin-vue-query options ${version}`, () => {
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
      try {
        const fileContent = await fs.readFile(file.path, 'utf-8')
        await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginVueQuery', name, getRelativePath(output, file.path)))
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
