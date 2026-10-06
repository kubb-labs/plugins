import type { Config } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from 'kubb/kit/testing'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { resolverClient } from '@internals/client'
import { describe, expect, test } from 'vitest'
import { matchFiles } from '#mocks'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { suspenseInfiniteQueryGenerator } from './suspenseInfiniteQueryGenerator.tsx'

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

// Shared operation nodes
const findByTagsNode = ast.factory.createOperation({
  operationId: 'findPetsByTags',
  method: 'GET',
  path: '/pet/findByTags',
  tags: ['pet'],
  parameters: [
    ast.factory.createParameter({
      name: 'tags',
      in: 'query',
      schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] }),
      required: true,
    }),
    ast.factory.createParameter({ name: 'status', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
    ast.factory.createParameter({ name: 'pageSize', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const getPetByIdNode = ast.factory.createOperation({
  operationId: 'getPetById',
  method: 'GET',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
    ast.factory.createResponse({ statusCode: '400', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Invalid ID supplied' }),
  ],
})

const suspenseInfiniteConfig = {
  suspense: {},
  infinite: {
    queryParam: 'pageSize',
    initialPageParam: 0,
    cursorParam: null,
    nextParam: null,
    previousParam: null,
  },
} as const

describe('suspenseInfiniteQueryGenerator operation', () => {
  const testData = [
    { name: 'findByTags', node: findByTagsNode, options: { ...suspenseInfiniteConfig } },
    {
      name: 'clientPostImportPath',
      node: findByTagsNode,
      options: { ...suspenseInfiniteConfig, client: { kind: 'contract', pluginName: 'plugin-axios' } },
    },
    {
      name: 'findByTagsObject',
      node: findByTagsNode,
      options: { ...suspenseInfiniteConfig },
    },
    { name: 'getPetIdCamelCase', node: getPetByIdNode, options: { ...suspenseInfiniteConfig } },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginReactQuery['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver(props.name)

    await renderGeneratorOperation(suspenseInfiniteQueryGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('suspenseInfiniteQueryGenerator operation with hooks disabled', () => {
  test('returns no file when hooks is false', async () => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...suspenseInfiniteConfig,
      hooks: false,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver('hooksDisabled')

    await renderGeneratorOperation(suspenseInfiniteQueryGenerator, findByTagsNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    expect(driver.fileManager.files).toStrictEqual([])
  })
})
