import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from '@typescript/typescript6'
import { adapterOas } from '@kubb/adapter-oas'
import { Hookable, createKubb } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginAxios } from '@kubb/plugin-axios'
import { pluginClient } from '@kubb/plugin-client'
import { pluginCypress } from '@kubb/plugin-cypress'
import { pluginFetch } from '@kubb/plugin-fetch'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginMcp } from '@kubb/plugin-mcp'
import { pluginMsw } from '@kubb/plugin-msw'
import { pluginReactQuery } from '@kubb/plugin-react-query'
import { pluginSwr } from '@kubb/plugin-swr'
import { pluginTs, resolverTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pluginVueQuery } from '@kubb/plugin-vue-query'
import { type Config, fsStorage, type KubbHooks } from 'kubb/kit'
import { expect, test } from 'vitest'

const dirname = path.dirname(fileURLToPath(import.meta.url))

test.each([
  { name: 'fetch', client: () => pluginFetch() },
  { name: 'axios', client: () => pluginAxios() },
  { name: 'custom', client: () => pluginClient({ importPath: '@example/client' }) },
])('keeps operation exports unique across all generators with the $name client', async ({ client }) => {
  const output = await fs.mkdtemp(path.join(dirname, '.operation-name-collisions-'))
  try {
    const { files, diagnostics } = await createKubb(
      {
        root: dirname,
        input: '../../schemas/3.0.x/operationNameCollisions.yaml',
        output: { path: output, barrel: false },
        adapter: adapterOas({ validate: false }),
        parsers: [parserTs()],
        reporters: [],
        storage: fsStorage(),
        plugins: [
          pluginTs(),
          pluginZod(),
          pluginFaker(),
          client(),
          pluginReactQuery({ output: { path: 'react' }, hooks: true }),
          pluginVueQuery({ output: { path: 'vue' }, hooks: true }),
          pluginSwr({ output: { path: 'swr' } }),
          pluginMsw({ output: { path: 'msw' }, handlers: true }),
          pluginCypress({ output: { path: 'cypress' } }),
          pluginMcp({ output: { path: 'mcp' } }),
        ],
      } as Config,
      { hooks: new Hookable<KubbHooks>() },
    ).safeBuild()
    expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([])

    const expectedNames = {
      types: ['PetListStatus200', 'PetListStatus2002'],
      zod: ['petListStatus200Schema', 'petListStatus200Schema2'],
      mocks: ['createPetListStatus200', 'createPetListStatus2002'],
      clients: ['petList', 'petList2'],
      react: ['usePetList', 'usePetList2'],
      vue: ['usePetList', 'usePetList2'],
      swr: ['usePetList', 'usePetList2'],
      msw: ['petListHandler', 'petListHandler2'],
      cypress: ['petList', 'petList2'],
      mcp: ['petListHandler', 'petListHandler2'],
    }
    for (const [directory, expected] of Object.entries(expectedNames)) {
      const names = files
        .filter((file) => file.path.startsWith(`${path.join(output, directory)}${path.sep}`))
        .flatMap((file) => file.sources.filter((source) => source.isExportable && source.isIndexable).map((source) => source.name))
      expect(names, directory).toEqual(expect.arrayContaining(expected))
      expect(new Set(names).size, directory).toBe(names.length)
    }

    for (const directory of ['react', 'vue', 'swr', 'mcp']) {
      const paths = (await fs.readdir(path.join(output, directory), { recursive: true })).filter((file) => file.endsWith('.ts'))
      const sources = await Promise.all(paths.map((file) => fs.readFile(path.join(output, directory, file), 'utf8')))
      expect(sources.join('\n'), directory).toMatch(/\bpetList2\s*[(<]/)
    }

    const paths = (await fs.readdir(output, { recursive: true })).filter((file) => file.endsWith('.ts')).map((file) => path.join(output, file))
    const program = ts.createProgram(paths, {
      noEmit: true,
      skipLibCheck: true,
      module: ts.ModuleKind.Preserve,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    })
    expect(program.getSyntacticDiagnostics().map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([])
  } finally {
    await fs.rm(output, { recursive: true, force: true })
  }
})

test.each(['', 'Api'])('keeps component, operation, and inline enum exports distinct with prefix %j', async (prefix) => {
  const output = await fs.mkdtemp(path.join(dirname, '.name-collisions-'))
  try {
    const { diagnostics } = await createKubb(
      {
        root: dirname,
        input: '../../schemas/3.0.x/nameCollisions.yaml',
        output: { path: output, barrel: false },
        adapter: adapterOas({ validate: false }),
        parsers: [parserTs()],
        reporters: [],
        storage: fsStorage(),
        plugins: [
          pluginTs({ resolver: { name: (name) => `${prefix}${resolverTs.name(name)}` } }),
          pluginZod(),
          pluginFetch({ validator: 'zod' }),
          pluginFaker(),
        ],
      } as Config,
      { hooks: new Hookable<KubbHooks>() },
    ).safeBuild()
    expect(diagnostics.filter((diagnostic) => diagnostic.severity === 'error')).toEqual([])

    const operation = await fs.readFile(path.join(output, 'types/CreateContainer.ts'), 'utf8')
    expect(operation).toContain(`export type ${prefix}CreateContainerBody3 = ${prefix}CreateContainerBody`)
    expect(operation).toContain(`body: ${prefix}CreateContainerBody3`)
    const first = await fs.readFile(path.join(output, 'types/First.ts'), 'utf8')
    const second = await fs.readFile(path.join(output, 'types/Second.ts'), 'utf8')
    expect(first).toContain('export const mitigationActionEnum =')
    expect(second).toContain('export const mitigationActionEnum2 =')
    const auth = await fs.readFile(path.join(output, 'zod/provider/authSchema.ts'), 'utf8')
    expect(auth).toContain('export const providerAuthErrorSchema2 =')
    const factory = await fs.readFile(path.join(output, 'mocks/createCreateContainer.ts'), 'utf8')
    expect(factory).toContain('export function createCreateContainerBody3')

    const files = (await fs.readdir(output, { recursive: true })).filter((file) => file.endsWith('.ts')).map((file) => path.join(output, file))
    const program = ts.createProgram(files, {
      noEmit: true,
      skipLibCheck: true,
      strict: true,
      module: ts.ModuleKind.Preserve,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      target: ts.ScriptTarget.ES2022,
    })
    expect(ts.getPreEmitDiagnostics(program).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([])
  } finally {
    await fs.rm(output, { recursive: true, force: true })
  }
})
