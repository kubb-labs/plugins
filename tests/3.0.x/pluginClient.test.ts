import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { AsyncEventEmitter, type Config, createKubb, Diagnostics, fsStorage, type KubbHooks } from '@kubb/core'
import { pluginBarrel } from '@kubb/plugin-barrel'
import { parserTs } from '@kubb/parser-ts'
import { pluginClient } from '@kubb/plugin-client'
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
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginZod({ output: { path: './zod', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
          parser: 'zod',
        }),
      ],
    },
  },

  // ─── parser zod with date coercion (regression for #3511) ───────────────
  {
    name: 'parserZodDateCoercion',
    config: {
      root: __dirname,
      input: { path: '../../schemas/3.0.x/dateFieldRequest.yaml' },
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, dateType: 'date' }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginZod({ output: { path: './zod', barrel: false }, coercion: { dates: true } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs],
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        pluginClient({
          output: { path: './clients', barrel: false },
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
        await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginClient', name, getRelativePath(output, file.path)))
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  // Regression for https://github.com/kubb-labs/plugins/issues/331: the petstore tag
  // `pet` and schema `Pet` share a name. With the barrel middleware active, the root
  // `index.ts` re-exports both, so the tag class must be `PetClient` to avoid a TS2300
  // duplicate-identifier error. Asserted on the barrel string rather than snapshotted, so
  // it stays robust across environments.
  test('class clients keep a distinct name from schema models in the barrel', async () => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-barrel-${Date.now()}`)
    const output = path.join(tmpDir, 'gen')
    const { files, diagnostics } = await createKubb(
      {
        root: __dirname,
        input: { path: '../../schemas/3.0.x/petStore.yaml' },
        output: { path: output, barrel: { type: 'named' } },
        adapter: adapterOas({ validate: false }),
        parsers: [parserTs],
        reporters: [],
        storage: fsStorage(),
        plugins: [
          pluginBarrel(),
          pluginTs({ output: { path: './types', barrel: { type: 'named' } } }),
          pluginClient({ output: { path: './clients', barrel: { type: 'named' } }, clientType: 'class' }),
        ],
      } as Config,
      { hooks: new AsyncEventEmitter<KubbHooks>() },
    ).safeBuild()

    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    const rootBarrel = files.find((file) => file.path === path.join(output, 'index.ts'))
    expect(rootBarrel).toBeDefined()
    const source = await fs.readFile(rootBarrel!.path, 'utf-8')

    expect(source).toContain("export { PetClient } from './clients/petClient.ts'")
    expect(source).toContain("export type { Pet } from './types/Pet.ts'")
    expect(source).not.toMatch(/export \{ Pet \}/)

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
