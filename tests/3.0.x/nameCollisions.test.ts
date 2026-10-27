import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getRelativePath } from '@internals/utils'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginClient } from '@kubb/plugin-client'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs, resolverTs } from '@kubb/plugin-ts'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import { pluginZod } from '@kubb/plugin-zod'
import { type Config, Diagnostics, type KubbHooks, fsStorage } from 'kubb/kit'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const version = '3.0.x'

type BuildConfig = Omit<Config, 'plugins' | 'reporters'> & { plugins: unknown }

/** Every generator that emits an operation, so a renamed declaration shows up in each of them. */
function allGenerators(client: unknown) {
  return [
    pluginTs(),
    pluginZod(),
    pluginFaker(),
    client,
    pluginReactQuery({ output: { path: 'react' }, hooks: true }),
    pluginVueQuery({ output: { path: 'vue' }, hooks: true }),
    pluginSwr({ output: { path: 'swr' } }),
    pluginMsw({ output: { path: 'msw' }, handlers: true }),
    pluginCypress({ output: { path: 'cypress' } }),
    pluginMcp({ output: { path: 'mcp' } }),
  ]
}

const configs: Array<{ name: string; config: BuildConfig }> = [
  // ─── operation declarations that collide with each other ─────────────────
  {
    name: 'operationsWithFetch',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/operationNameCollisions.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: allGenerators(pluginFetch()),
    },
  },
  {
    name: 'operationsWithAxios',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/operationNameCollisions.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: allGenerators(pluginAxios()),
    },
  },
  {
    name: 'operationsWithCustomClient',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/operationNameCollisions.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: allGenerators(pluginClient({ importPath: '@example/client' })),
    },
  },

  // ─── components, operations and inline enums competing for one name ──────
  {
    name: 'components',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/nameCollisions.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [pluginTs(), pluginZod(), pluginFetch({ validator: 'zod' }), pluginFaker()],
    },
  },
  {
    /** A custom `name` maps distinct schemas onto one identifier, so the allocator has to split them again. */
    name: 'componentsWithPrefix',
    config: {
      root: __dirname,
      input: '../../schemas/3.0.x/nameCollisions.yaml',
      output: { path: './gen', barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs()],
      storage: fsStorage(),
      plugins: [pluginTs({ resolver: { name: (name) => `Api${resolverTs.name(name)}` } }), pluginZod(), pluginFetch({ validator: 'zod' }), pluginFaker()],
    },
  },
]

describe(`name collisions ${version}`, () => {
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

    expect(files.length).toBeGreaterThan(0)
    expect(Diagnostics.hasError(diagnostics)).toBe(false)

    for (const file of files) {
      const fileContent = await fs.readFile(file.path, 'utf-8')
      await expect(fileContent).toMatchFileSnapshot(path.join(__dirname, '__snapshots__', 'nameCollisions', name, getRelativePath(output, file.path)))
    }

    await fs.rm(tmpDir, { recursive: true, force: true })
  })
})
