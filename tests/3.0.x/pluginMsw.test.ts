import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { ast, type Config, defineMacro, Diagnostics, type KubbHooks, fsStorage } from 'kubb/kit'
import { parserTs } from '@kubb/parser-ts'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

type BuildConfig = Omit<Config, 'plugins' | 'reporters'> & { plugins: unknown }

const configs: Array<{ name: string; config: BuildConfig }> = [
  // ─── parser: faker ──────────────────────────────────────────────────────
  {
    name: 'parserFaker',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginFaker({ output: { path: './faker', barrel: false, mode: 'directory' } }),
        pluginMsw({
          output: { path: './msw', barrel: false, mode: 'directory' },
          parser: 'faker',
        }),
      ],
    },
  },

  // ─── baseURL ────────────────────────────────────────────────────────────
  {
    name: 'baseURL',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/petStore.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false, enums: 'root' }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
        pluginMsw({
          output: { path: './msw', barrel: false, mode: 'directory' },
          baseURL: 'http://localhost:3000',
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
        pluginMsw({
          output: { path: './msw', barrel: false, mode: 'directory' },
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
        pluginMsw({
          output: { path: './msw', barrel: false, mode: 'directory' },
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
        pluginMsw({
          output: { path: './msw', barrel: false, mode: 'directory' },
          group: { type: 'tag' },
        }),
      ],
    },
  },
]

describe(`plugin-msw options ${version}`, () => {
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
        hooks: new Hookable<KubbHooks>(),
      },
    ).safeBuild()

    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    // Snapshot only this plugin's output. The plugins it builds on have their own suites.
    const ownFiles = files.filter((file) => /^\.\/msw\//.test(getRelativePath(output, file.path)))
    expect(ownFiles.length).toBeGreaterThan(0)

    for (const file of ownFiles) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'pluginMsw', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  test('a macro that changes the method on plugin-msw only keeps the plugin-ts and plugin-faker names', async () => {
    const tmpDir = path.join(os.tmpdir(), `kubb-test-mswMethodMacro-${Date.now()}`)
    const output = path.join(tmpDir, 'mswMethodMacro')
    const getAsPost = defineMacro({
      name: 'get-as-post',
      operation: (node) => (ast.http.isOperation(node) && node.method === 'GET' ? { ...node, method: 'POST' } : undefined),
    })
    const { diagnostics } = await createKubb(
      {
        root: __dirname,
        input: '../../schemas/3.0.x/petStore.yaml',
        output: { path: output, barrel: false },
        adapter: adapterOas({ validate: false, enums: 'root' }),
        parsers: [parserTs()],
        storage: fsStorage(),
        plugins: [
          pluginTs({ output: { path: './types', barrel: false, mode: 'directory' } }),
          pluginFaker({ output: { path: './faker', barrel: false, mode: 'directory' } }),
          pluginMsw({ output: { path: './msw', barrel: false, mode: 'directory' }, parser: 'faker', handlers: true, macros: [getAsPost] }),
        ],
      } as Config,
      {
        hooks: new Hookable<KubbHooks>(),
      },
    ).safeBuild()

    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    const handler = await fs.readFile(path.join(output, 'msw', 'findPetsByStatusHandler.ts'), 'utf-8')
    expect(handler).toContain('http.post(')

    // Every name the handler imports from plugin-ts and plugin-faker has to be one those plugins emit.
    const imports = [...handler.matchAll(/import (?:type )?\{ ([^}]+) \} from '(\.\.\/(?:types|faker)\/[^']+)'/g)]
    expect(imports).toHaveLength(2)
    for (const [, names, source] of imports) {
      const targetContent = await fs.readFile(path.resolve(output, 'msw', `${source}.ts`), 'utf-8')
      for (const name of names!.split(', ')) {
        expect(targetContent).toMatch(new RegExp(`export (?:type|function) ${name}\\b`))
      }
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
