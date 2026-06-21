import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, type Config, createKubb, Diagnostics, fsStorage, type KubbHooks } from '@kubb/core'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginBarrel } from '@kubb/plugin-barrel'
import { parserTs } from '@kubb/parser-ts'
import { pluginTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

type BuildConfig = Omit<Config, 'plugins' | 'storage' | 'reporters'> & { plugins: unknown }

const configs: Array<{ name: string; config: BuildConfig }> = [
  // ─── default (per-operation functions) ──────────────────────────────────
  {
    name: 'default',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [pluginTs({ output: { path: './types', barrel: false } }), pluginAxios({ output: { path: './clients', barrel: false } })],
    },
  },

  // ─── sdk class (one static class per tag) ───────────────────────────────
  {
    name: 'sdkClass',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginAxios({ output: { path: './clients', barrel: false }, sdk: { shape: 'class' } }),
      ],
    },
  },

  // ─── sdk class with aggregation barrel ──────────────────────────────────
  {
    name: 'sdkClassWithName',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginAxios({ output: { path: './clients', barrel: false }, sdk: { shape: 'class', name: 'PetStore' } }),
      ],
    },
  },

  // ─── sdk function with `export * as` aggregation namespace ───────────────
  {
    name: 'sdkFunctionWithName',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/petStore.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginAxios({
          output: { path: './clients', barrel: false },
          sdk: { shape: 'function', name: 'petStore' },
          group: { type: 'tag', name: ({ group }) => `${group}Client` },
        }),
      ],
    },
  },
]

describe(`plugin-axios options ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-axios-${name}-${Date.now()}`)
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
        await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginAxios', name, getRelativePath(output, file.path)))
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  // The petstore tag `pet` and schema `Pet` share a name. With the barrel middleware active, the
  // root `index.ts` re-exports both, so the generated sdk class must be `PetClient` to avoid a
  // TS2300 duplicate-identifier error. Asserted on the barrel string so it stays robust across
  // environments.
  test('sdk classes keep a distinct name from schema models in the barrel', async () => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-axios-barrel-${Date.now()}`)
    const output = path.join(tmpDir, 'gen')
    const { files, diagnostics } = await createKubb(
      {
        root: __dirname,
        input: { path: '../../schemas/3.0.x/petStore.yaml' },
        output: { path: output, barrel: { type: 'named' } },
        adapter: adapterOas({ validate: false, enums: 'root' }),
        parsers: [parserTs],
        reporters: [],
        storage: fsStorage(),
        plugins: [
          pluginBarrel(),
          pluginTs({ output: { path: './types', barrel: { type: 'named' } } }),
          pluginAxios({ output: { path: './clients', barrel: { type: 'named' } }, sdk: { shape: 'class' } }),
        ],
      } as Config,
      { hooks: new AsyncEventEmitter<KubbHooks>() },
    ).safeBuild()

    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    const rootBarrel = files.find((file) => file.path === path.join(output, 'index.ts'))
    expect(rootBarrel).toBeDefined()
    const source = await fs.readFile(rootBarrel!.path, 'utf-8')

    expect(source).toContain('PetClient')
    expect(source).toContain("export type { Pet } from './types/Pet.ts'")
    expect(source).not.toMatch(/export \{ Pet \}/)

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
