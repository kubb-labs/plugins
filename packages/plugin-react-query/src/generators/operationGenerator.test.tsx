import type { Config } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from 'kubb/kit/testing'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { resolverClient } from '@internals/client'
import { describe, expect, test, vi } from 'vitest'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'
import { operationGenerator } from './operationGenerator.tsx'
import { queryGenerator } from './queryGenerator.tsx'

const testConfig: Config = {
  root: '.',
  input: {},
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  reporters: [],
  adapter: createMockedAdapter(),
  storage: memoryStorage(),
}

const defaultOptions: PluginReactQuery['resolvedOptions'] = {
  client: { kind: 'contract', pluginName: 'plugin-axios' },
  queryKey: queryKeyTransformer,
  mutationKey: mutationKeyTransformer,
  query: {
    importPath: '@tanstack/react-query',
    methods: ['GET'],
  },
  mutation: {
    methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
    importPath: '@tanstack/react-query',
  },
  suspense: false,
  infinite: false,
  customOptions: null,
  hooks: true,
  exclude: [],
  include: undefined,
  override: [],
  output: { path: '.', mode: 'directory' },
  group: null,
  resolver: resolverReactQuery,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const mockedAxiosPlugin = createMockedPlugin({
  name: 'plugin-axios',
  options: { output: { path: './clients', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverClient,
})

// The generator looks plugins up by name: plugin-ts for the request types, plugin-axios for the
// contract <op>. The built-in mock is name-agnostic, so dispatch on the name here.
function createMultiPluginDriver(name: string) {
  const driver = createMockedPluginDriver({
    name,
    plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
  })
  const byName = { 'plugin-ts': mockedTsPlugin, 'plugin-axios': mockedAxiosPlugin } as Record<string, { resolver?: unknown }>
  return {
    ...driver,
    getPlugin: (pluginName: string) => byName[pluginName] ?? mockedTsPlugin,
    getResolver: (pluginName: string) => byName[pluginName]?.resolver ?? resolverTs,
  } as typeof driver
}

const getPetByIdNode = ast.factory.createOperation({
  operationId: 'getPetById',
  method: 'GET',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [
    ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ast.factory.createParameter({ name: 'page', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const updatePetByIdNode = ast.factory.createOperation({
  operationId: 'updatePetWithForm',
  method: 'POST',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  requestBody: {
    content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  },
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

async function runOperationGenerator(node: ast.OperationNode, options: PluginReactQuery['resolvedOptions'], driverName: string) {
  const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
  const driver = createMultiPluginDriver(driverName)

  await renderGeneratorOperation(operationGenerator, node, {
    config: testConfig,
    adapter: createMockedAdapter(),
    driver,
    plugin,
    options,
    resolver: resolverReactQuery,
  })

  return driver.fileManager.files
}

describe('operationGenerator operation', () => {
  test('emits only the mutation output for a mutation operation, even with suspense and infinite enabled', async () => {
    const options: PluginReactQuery['resolvedOptions'] = { ...defaultOptions, suspense: {}, infinite: { queryParam: 'page' } }

    const files = await runOperationGenerator(updatePetByIdNode, options, 'mutationOnly')

    expect(files.length).toBe(1)
    expect(files[0]?.baseName).toBe('useUpdatePetWithForm.ts')
  })

  test('emits every enabled query-family file for a query operation, in one dispatch', async () => {
    const options: PluginReactQuery['resolvedOptions'] = { ...defaultOptions, suspense: {}, infinite: { queryParam: 'page' } }

    const files = await runOperationGenerator(getPetByIdNode, options, 'queryFamily')
    const baseNames = files.map((file) => file.baseName).sort()

    expect(baseNames).toStrictEqual(['useGetPetById.ts', 'useGetPetByIdSuspense.ts', 'useGetPetByIdInfinite.ts', 'useGetPetByIdSuspenseInfinite.ts'].sort())
  })

  test('emits only the base query file when suspense and infinite are disabled', async () => {
    const files = await runOperationGenerator(getPetByIdNode, defaultOptions, 'queryDefault')

    expect(files.length).toBe(1)
    expect(files[0]?.baseName).toBe('useGetPetById.ts')
  })

  test('calls only the mutation-family generator for a mutation operation', async () => {
    using querySpy = vi.spyOn(queryGenerator, 'operation')
    using mutationSpy = vi.spyOn(mutationGenerator, 'operation')

    await runOperationGenerator(updatePetByIdNode, defaultOptions, 'spyMutation')

    expect(mutationSpy).toHaveBeenCalledOnce()
    expect(querySpy).not.toHaveBeenCalled()
  })

  test('calls only the query-family generators for a query operation', async () => {
    using querySpy = vi.spyOn(queryGenerator, 'operation')
    using mutationSpy = vi.spyOn(mutationGenerator, 'operation')

    await runOperationGenerator(getPetByIdNode, defaultOptions, 'spyQuery')

    expect(querySpy).toHaveBeenCalledOnce()
    expect(mutationSpy).not.toHaveBeenCalled()
  })
})
