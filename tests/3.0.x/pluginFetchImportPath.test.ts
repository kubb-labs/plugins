import { execFileSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { type Config, Diagnostics, fsStorage, type KubbHooks } from 'kubb/kit'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginKy } from '@kubb/plugin-ky'
import { parserTs } from '@kubb/parser-ts'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const tscFlags =
  '--ignoreConfig --noEmit --strict --skipLibCheck --allowImportingTsExtensions --module preserve --moduleResolution bundler --target es2022 --lib es2022,dom '.split(
    ' ',
  )

type FetchOptions = NonNullable<Parameters<typeof pluginFetch>[0]>

/**
 * Generates into this package, so the generated code resolves `zod` and `@tanstack/react-query`, with `importPath`
 * pointing at a binding that only re-exports the `.kubb/` runtime. `typecheck` runs tsc on every generated file.
 */
async function generate(
  name: string,
  {
    input,
    sdk,
    validator,
    plugins = [],
    transport = pluginFetch,
  }: {
    input: string
    sdk?: FetchOptions['sdk']
    validator?: FetchOptions['validator']
    plugins?: Array<unknown>
    transport?: typeof pluginFetch | typeof pluginAxios | typeof pluginKy
  },
) {
  const output = path.join(__dirname, `.import-path-${name}-${Date.now()}`)
  const { diagnostics } = await createKubb(
    {
      root: __dirname,
      input: `../../schemas/3.0.x/${input}`,
      output: { path: output, barrel: false },
      adapter: adapterOas({ validate: false }),
      parsers: [parserTs()],
      reporters: [],
      storage: fsStorage(),
      plugins: [
        pluginTs({ output: { path: './types', barrel: false } }),
        ...plugins,
        transport({ output: { path: './clients', barrel: false }, importPath: '../api/client', sdk, validator }),
      ],
    } as Config,
    { hooks: new Hookable<KubbHooks>() },
  ).safeBuild()

  await fs.mkdir(path.join(output, 'api'))
  await fs.writeFile(path.join(output, 'api/client.ts'), "export * from '../.kubb/client.ts'\n")
  const generated = (await fs.readdir(output, { recursive: true }))
    .filter((file) => /\.tsx?$/.test(file) && !file.startsWith('.kubb'))
    .map((file) => path.join(output, file))
  const read = (dir: string) => Promise.all(generated.filter((file) => file.startsWith(path.join(output, dir))).map((file) => fs.readFile(file, 'utf-8')))

  return {
    diagnostics,
    clients: await read('clients'),
    hooks: await read('hooks'),
    runtime: await fs.readdir(path.join(output, '.kubb')),
    runtimeClient: await fs.readFile(path.join(output, '.kubb/client.ts'), 'utf-8'),
    typecheck: (include: (file: string) => boolean = () => true) =>
      execFileSync(path.join(__dirname, 'node_modules/.bin/tsc'), [...tscFlags, ...generated.filter(include)], { encoding: 'utf8' }),
    cleanup: () => fs.rm(output, { recursive: true, force: true }),
  }
}

describe('plugin-fetch importPath 3.0.x', () => {
  test.each([
    { name: 'functions', sdk: undefined },
    { name: 'sdk', sdk: {} },
  ])('$name: imports from importPath, keeps securitySchemes and typed headers, and writes the .kubb/ runtime', async ({ name, sdk }) => {
    const { diagnostics, clients, runtime, typecheck, cleanup } = await generate(name, { input: 'train-travel.yaml', sdk })

    try {
      expect(Diagnostics.hasError(diagnostics)).toBe(false)
      expect(runtime).toEqual(expect.arrayContaining(['client.ts', 'config.ts', 'core.ts']))
      expect(clients.every((file) => file.includes("from '../api/client'"))).toBe(true)
      expect(clients.some((file) => /import \{[^}]*\bsecuritySchemes\b[^}]*\} from '\.\.\/api\/client'/.test(file))).toBe(true)
      expect(clients.some((file) => file.includes('RequestResultWithHeaders'))).toBe(true)
      expect(typecheck).not.toThrow()
    } finally {
      await cleanup()
    }
  })

  test('validator: header params import toHeadersStandardSchema from the .kubb/ runtime, which the binding does not re-export', async () => {
    const { diagnostics, clients, typecheck, cleanup } = await generate('validator', {
      input: 'petStore.yaml',
      validator: { params: 'zod' },
      plugins: [pluginZod({ output: { path: './zod', barrel: false } })],
    })

    try {
      expect(Diagnostics.hasError(diagnostics)).toBe(false)
      expect(clients.some((file) => file.includes('toHeadersStandardSchema'))).toBe(true)
      expect(typecheck).not.toThrow()
    } finally {
      await cleanup()
    }
  })

  test('React Query hooks keep the typed headers the operations return', async () => {
    const { diagnostics, hooks, typecheck, cleanup } = await generate('react-query', {
      input: 'train-travel.yaml',
      plugins: [pluginReactQuery({ output: { path: './hooks', barrel: false }, client: 'fetch', returnType: 'full' })],
    })

    try {
      expect(Diagnostics.hasError(diagnostics)).toBe(false)
      expect(hooks.length).toBeGreaterThan(0)
      expect(hooks.some((file) => /import type \{[^}]*\bRequestResultWithHeaders\b[^}]*\} from '\.\.\/api\/client'/.test(file))).toBe(true)
      // `@tanstack/react-query` is not installed in this package, so only the clients are typechecked here.
      expect(() => typecheck((file) => !file.includes(`${path.sep}hooks${path.sep}`))).not.toThrow()
    } finally {
      await cleanup()
    }
  })

  // `axios` and `ky` are not installed in this package, so these check the output without typechecking it.
  test.each([
    { name: 'axios', transport: pluginAxios, runtimeImport: "from 'axios'" },
    { name: 'ky', transport: pluginKy, runtimeImport: "from 'ky'" },
  ])('$name: imports from importPath and writes its own .kubb/ runtime', async ({ name, transport, runtimeImport }) => {
    const output = await generate(name, { input: 'train-travel.yaml', transport })

    try {
      expect(Diagnostics.hasError(output.diagnostics)).toBe(false)
      expect(output.clients.every((file) => file.includes("from '../api/client'"))).toBe(true)
      expect(output.runtimeClient).toContain(runtimeImport)
    } finally {
      await output.cleanup()
    }
  })
})
