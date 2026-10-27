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
import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginTs } from '@kubb/plugin-ts'
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
        pluginZod({ output: { path: './zod', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginMcp({
          output: { path: './mcp', barrel: false, mode: 'directory' },
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
        pluginZod({ output: { path: './zod', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginMcp({
          output: { path: './mcp', barrel: false, mode: 'directory' },
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
        pluginZod({ output: { path: './zod', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginMcp({
          output: { path: './mcp', barrel: false, mode: 'directory' },
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
        pluginZod({ output: { path: './zod', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginMcp({
          output: { path: './mcp', barrel: false, mode: 'directory' },
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
        pluginZod({ output: { path: './zod', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginMcp({
          output: { path: './mcp', barrel: false, mode: 'directory' },
          group: { type: 'tag' },
        }),
      ],
    },
  },

  // ─── with explicit client plugin ──────────────────────────────────────────
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
        pluginZod({ output: { path: './zod', barrel: false, mode: 'directory' } }),
        pluginAxios({ output: { path: './clients', barrel: false, mode: 'directory' } }),
        pluginMcp({
          output: { path: './mcp', barrel: false, mode: 'directory' },
        }),
      ],
    },
  },
]

describe(`plugin-mcp options ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-${name}-${Date.now()}`)
    const output = path.join(tmpDir, name)
    const { files, diagnostics } = await createKubb(
      {
        ...config,
        // Root the build in the temp dir, as in a real project, so the `.mcp.json` path to
        // `start.ts` (relative to `root`) stays the same between runs.
        root: tmpDir,
        input: path.resolve(config.root, config.input as string),
        output: {
          ...config.output,
          path: output,
        },
      } as Config,
      {
        hooks: new Hookable<KubbHooks>(),
      },
    ).safeBuild()

    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    // Snapshot only this plugin's output. The plugins it builds on have their own suites.
    const ownFiles = files.filter((file) => /^\.\/mcp\//.test(getRelativePath(output, file.path)))
    expect(ownFiles.length).toBeGreaterThan(0)

    for (const file of ownFiles) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginMcp', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
