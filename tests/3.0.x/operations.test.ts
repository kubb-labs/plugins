import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { type Config, Diagnostics, fsStorage, type KubbHooks } from 'kubb/kit'
import { parserTs } from '@kubb/parser-ts'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { afterAll, beforeAll, describe, expect, test } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const output = path.join(__dirname, `.operation-types-${Date.now()}`)

describe("pluginTs({ operations: 'inline' }) with its consumers", () => {
  beforeAll(async () => {
    const { diagnostics } = await createKubb(
      {
        root: __dirname,
        input: '../../schemas/3.0.x/petStore.yaml',
        output: { path: output, barrel: false },
        adapter: adapterOas({ validate: false }),
        parsers: [parserTs()],
        reporters: [],
        storage: fsStorage(),
        plugins: [
          pluginTs({ output: { path: './types', barrel: false }, operations: 'inline' }),
          pluginFetch({ output: { path: './clients', barrel: false } }),
          pluginReactQuery({ output: { path: './hooks', barrel: false }, hooks: true, infinite: { queryParam: 'status', initialPageParam: 'available' } }),
          pluginFaker({ output: { path: './mocks', barrel: false } }),
          pluginMsw({ output: { path: './msw', barrel: false }, parser: 'faker' }),
          pluginCypress({ output: { path: './cypress', barrel: false } }),
        ],
      } as Config,
      { hooks: new Hookable<KubbHooks>() },
    ).safeBuild()
    expect(Diagnostics.hasError(diagnostics)).toBe(false)
  })

  afterAll(() => fs.rm(output, { recursive: true, force: true }))

  test('emits only schema types and prints operation types inline', async () => {
    expect((await fs.readdir(path.join(output, 'types'))).sort()).toEqual(['AddPetRequest.ts', 'ApiResponse.ts', 'Category.ts', 'Order.ts', 'Pet.ts', 'Tag.ts'])

    const hook = await fs.readFile(path.join(output, 'hooks/usePlaceOrder.ts'), 'utf-8')
    expect(hook).toContain("import type { Order } from '../types/Order'")
    // `placeOrder`'s body is not `required`: the optionality moves to the `body?` key.
    expect(hook).toMatch(/mutationOptions<\s*Order,\s*ResponseErrorConfig<unknown>,\s*\{\s*body\?: Order;/)
    // The infinite query indexes the printed query type for its page param.
    expect(await fs.readFile(path.join(output, 'hooks/useFindPetsByStatusInfinite.ts'), 'utf-8')).toMatch(/\}\['status'\]/)
  })

  function tsc(dirs: Array<string>, flags: string): Array<string> {
    try {
      execFileSync(path.join(__dirname, 'node_modules/.bin/tsc'), [...flags.split(' '), ...dirs.map((dir) => path.join(output, dir, '*.ts'))], {
        encoding: 'utf8',
        shell: true,
      })
      return []
    } catch (error) {
      return (error as { stdout: string }).stdout.split('\n').filter((line) => line.includes('error TS'))
    }
  }
  const flags =
    '--ignoreConfig --noEmit --skipLibCheck --allowImportingTsExtensions --module preserve --moduleResolution bundler --target es2022 --lib es2022,dom'

  test('generates types, clients, and mocks that type-check', () => {
    expect(tsc(['types', 'clients', 'mocks'], `${flags} --strict`)).toEqual([])
  })

  test('generates hooks, handlers, and requests whose imports resolve', () => {
    // shortcut: this package does not install `@tanstack/react-query`, `msw` or `cypress`, so their imports and globals (and the strict-only `.kubb` runtime, checked above) are tolerated; add them as dev dependencies to type-check these strictly.
    const external = /\/\.kubb\/|TS2307: Cannot find module '(@tanstack|msw|cypress)|Cannot find name 'cy'|Cannot find namespace 'Cypress'/
    expect(tsc(['hooks', 'msw', 'cypress'], `${flags} --strict false`).filter((line) => !external.test(line))).toEqual([])
  })
})
