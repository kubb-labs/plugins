import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { type Config, Diagnostics, type KubbHooks, fsStorage } from 'kubb/kit'
import { parserTs } from '@kubb/parser-ts'
import { pluginAxios } from '@kubb/plugin-axios'
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
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginVueQuery({
          hooks: true,
          output: { path: './hooks', barrel: false, mode: 'directory' },
        }),
      ],
    },
  },

  // ─── infinite ───────────────────────────────────────────────────────────
  {
    name: 'infinite',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginVueQuery({
          hooks: true,
          output: { path: './hooks', barrel: false, mode: 'directory' },
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
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginZod({ output: { path: './zod', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' }, validator: 'zod' }),
        pluginVueQuery({
          hooks: true,
          output: { path: './hooks', barrel: false, mode: 'directory' },
        }),
      ],
    },
  },

  // ─── mutation disabled ──────────────────────────────────────────────────
  {
    name: 'mutationDisabled',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginVueQuery({
          hooks: true,
          output: { path: './hooks', barrel: false, mode: 'directory' },
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
      input: '../../schemas/3.0.x/paramsCasing.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginVueQuery({
          hooks: true,
          output: { path: './hooks', barrel: false, mode: 'directory' },
        }),
      ],
    },
  },

  // ─── exclude / include ─────────────────────────────────────────────────
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
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginVueQuery({
          hooks: true,
          output: { path: './hooks', barrel: false, mode: 'directory' },
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
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginVueQuery({
          hooks: true,
          output: { path: './hooks', barrel: false, mode: 'directory' },
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
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginVueQuery({
          hooks: true,
          output: { path: './hooks', barrel: false, mode: 'directory' },
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
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginVueQuery({
          hooks: true,
          output: { path: './hooks', barrel: false, mode: 'directory' },
        }),
      ],
    },
  },
]

describe(`plugin-vue-query options ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-vue-query-${name}-${Date.now()}`)
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
