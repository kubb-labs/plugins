import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { type Config, Diagnostics, fsStorage, type KubbHooks } from 'kubb/kit'
import { pluginBarrel } from '@kubb/plugin-barrel'
import { pluginFetch } from '@kubb/plugin-fetch'
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
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [pluginTs({ output: { path: './types', barrel: false } }), pluginFetch({ output: { path: './clients', barrel: false } })],
    },
  },

  // ─── sdk class (one instance class per tag) ─────────────────────────────
  {
    name: 'sdkClass',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [pluginTs({ output: { path: './types', barrel: false } }), pluginFetch({ output: { path: './clients', barrel: false }, sdk: {} })],
    },
  },

  // ─── sdk class with composed root ───────────────────────────────────────
  {
    name: 'sdkClassWithName',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFetch({ output: { path: './clients', barrel: false }, sdk: { name: 'PetStore' } }),
      ],
    },
  },

  // ─── sdk single (one flat class, every operation a direct method) ────────
  {
    name: 'sdkSingle',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginFetch({ output: { path: './clients', barrel: false }, sdk: { mode: 'flat', name: 'PetStore' } }),
      ],
    },
  },

  // ─── paramsCasing (camelCase types, spec names on the wire) ──────────────
  {
    name: 'paramsCasing',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/paramsCasing.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs],
      plugins: [pluginTs({ output: { path: './types', barrel: false } }), pluginFetch({ output: { path: './clients', barrel: false } })],
    },
  },
]

describe(`plugin-fetch options ${version}`, () => {
  test.each(configs)('config testing with config as $name', async ({ name, config }) => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-fetch-${name}-${Date.now()}`)
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
        hooks: new Hookable<KubbHooks>(),
      },
    ).safeBuild()

    expect(files.length).toBeGreaterThan(0)
    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    for (const file of files) {
      try {
        const fileContent = await fs.readFile(file.path, 'utf-8')
        await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginFetch', name, getRelativePath(output, file.path)))
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  test('emits template baseURL as a runtime expression in the client config', async () => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-fetch-base-url-template-${Date.now()}`)
    const output = path.join(tmpDir, 'gen')
    const { files, diagnostics } = await createKubb(
      {
        root: __dirname,
        input: '../../schemas/3.0.x/petStore.yaml',
        output: { path: output, barrel: false },
        adapter: adapterOas({ validate: false, enums: 'root' }),
        parsers: [parserTs],
        reporters: [],
        storage: fsStorage(),
        plugins: [
          pluginTs({ output: { path: './types', barrel: false } }),
          pluginFetch({
            output: { path: './clients', barrel: false },
            baseURL: '${import.meta.env.VITE_API_SERVER}',
          }),
        ],
      } as Config,
      { hooks: new Hookable<KubbHooks>() },
    ).safeBuild()

    expect(files.length).toBeGreaterThan(0)
    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    const clientRuntime = files.find((file) => file.path === path.join(output, '.kubb/client.ts'))
    expect(clientRuntime).toBeDefined()

    const source = await fs.readFile(clientRuntime!.path, 'utf-8')
    expect(source).toContain('client.setConfig({ baseURL: `${import.meta.env.VITE_API_SERVER}` })')
    expect(source).not.toContain('baseURL: "${import.meta.env.VITE_API_SERVER}"')

    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  // The petstore tag `pet` and schema `Pet` share a name. With the barrel middleware active, the
  // root `index.ts` re-exports both, so the generated sdk class must be `PetClient` to avoid a
  // TS2300 duplicate-identifier error. Asserted on the barrel string so it stays robust across
  // environments.
  test('sdk classes keep a distinct name from schema models in the barrel', async () => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-fetch-barrel-${Date.now()}`)
    const output = path.join(tmpDir, 'gen')
    const { files, diagnostics } = await createKubb(
      {
        root: __dirname,
        input: '../../schemas/3.0.x/petStore.yaml',
        output: { path: output, barrel: { type: 'named' } },
        adapter: adapterOas({ validate: false, enums: 'root' }),
        parsers: [parserTs],
        reporters: [],
        storage: fsStorage(),
        plugins: [
          pluginBarrel(),
          pluginTs({ output: { path: './types', barrel: { type: 'named' } } }),
          pluginFetch({ output: { path: './clients', barrel: { type: 'named' } }, sdk: {} }),
        ],
      } as Config,
      { hooks: new Hookable<KubbHooks>() },
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
