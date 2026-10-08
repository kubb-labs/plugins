import type { Config } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from 'kubb/kit/testing'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { resolverClient } from '@internals/client'
import { describe, expect, test, vi } from 'vitest'
import { matchFiles, rawSources } from '#mocks'
import { definePageParam, mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import type { Transformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { infiniteQueryGenerator } from './infiniteQueryGenerator.tsx'

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

const infiniteConfig = {
  queryParam: 'pageSize',
  initialPageParam: 0,
  cursorParam: null,
  nextParam: null,
  previousParam: null,
} as const

describe('infiniteQueryGenerator operation', () => {
  const testData = [
    { name: 'findByTags', node: findByTagsNode, options: { infinite: infiniteConfig } },
    {
      name: 'clientPostImportPath',
      node: findByTagsNode,
      options: { infinite: infiniteConfig, client: { kind: 'contract', pluginName: 'plugin-axios' } },
    },
    {
      name: 'findByTagsObject',
      node: findByTagsNode,
      options: { infinite: infiniteConfig },
    },
    { name: 'getPetIdCamelCase', node: getPetByIdNode, options: { infinite: infiniteConfig } },
    {
      name: 'findByTagsPageParamCode',
      node: findByTagsNode,
      options: {
        infinite: {
          ...infiniteConfig,
          getNextPageParam: '(lastPage) => (lastPage.hasNext ? lastPage.number + 1 : undefined)',
          getPreviousPageParam: '(firstPage) => (firstPage.number > 0 ? firstPage.number - 1 : undefined)',
        },
      },
    },
    { name: 'findByTagsInitialPageParam', node: findByTagsNode, options: { infinite: { ...infiniteConfig, initialPageParam: 1 } } },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginReactQuery['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver(props.name)

    await renderGeneratorOperation(infiniteQueryGenerator, props.node, {
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

describe('infiniteQueryGenerator operation with hooks disabled', () => {
  test('returns no file when hooks is false', async () => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      infinite: infiniteConfig,
      hooks: false,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver('hooksDisabled')

    await renderGeneratorOperation(infiniteQueryGenerator, findByTagsNode, {
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

describe('infiniteQueryGenerator queryKey', () => {
  test('passes the infiniteQuery variant to a custom queryKey', async () => {
    const queryKey = vi.fn<Transformer>(queryKeyTransformer)
    const options: PluginReactQuery['resolvedOptions'] = { ...defaultOptions, infinite: infiniteConfig, queryKey }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver('customQueryKey')

    await renderGeneratorOperation(infiniteQueryGenerator, findByTagsNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    expect(queryKey.mock.calls.map(([props]) => props.variant)).toEqual(['infiniteQuery'])
  })
})

describe('infiniteQueryGenerator page param resolution combinations', () => {
  const renderWithInfinite = async (infinite: PluginReactQuery['resolvedOptions']['infinite']) => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      infinite,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver('pageParamCombos')

    await renderGeneratorOperation(infiniteQueryGenerator, findByTagsNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    return rawSources(driver.fileManager.files)[0] ?? ''
  }

  test('only getNextPageParam is configured', async () => {
    const source = await renderWithInfinite({
      ...infiniteConfig,
      getNextPageParam: '(lastPage) => lastPage.next',
    })
    expect(source).toContain('getNextPageParam: (lastPage) => lastPage.next')
    expect(source).not.toContain('getPreviousPageParam')
  })

  test('mixed getNextPageParam and previousParam', async () => {
    const source = await renderWithInfinite({
      ...infiniteConfig,
      getNextPageParam: '(lastPage) => lastPage.next',
      previousParam: 'prevCursor',
    })
    expect(source).toContain('getNextPageParam: (lastPage) => lastPage.next')
    expect(source).toContain("getPreviousPageParam: (firstPage) => firstPage?.['prevCursor']")
  })

  test('mixed nextParam and getPreviousPageParam', async () => {
    const source = await renderWithInfinite({
      ...infiniteConfig,
      nextParam: 'nextCursor',
      getPreviousPageParam: '(firstPage) => firstPage.prev',
    })
    expect(source).toContain("getNextPageParam: (lastPage) => lastPage?.['nextCursor']")
    expect(source).toContain('getPreviousPageParam: (firstPage) => firstPage.prev')
  })

  test('only getPreviousPageParam is configured falls back to default getNextPageParam', async () => {
    const source = await renderWithInfinite({
      ...infiniteConfig,
      getPreviousPageParam: '(firstPage) => firstPage.prev',
    })
    expect(source).toContain('getNextPageParam: (lastPage, _allPages, lastPageParam) => Array.isArray(lastPage)')
    expect(source).toContain('getPreviousPageParam: (firstPage) => firstPage.prev')
  })

  test('supports definePageParam helper', async () => {
    const source = await renderWithInfinite({
      ...infiniteConfig,
      getNextPageParam: definePageParam<{ next?: number }>((lastPage) => lastPage.next),
    })
    expect(source).toContain('getNextPageParam: (lastPage) => lastPage.next')
  })

  test('supports function expression directly in config', async () => {
    const source = await renderWithInfinite({
      ...infiniteConfig,
      getNextPageParam: (lastPage: any) => lastPage.cursor,
    })
    expect(source).toContain('getNextPageParam: (lastPage) => lastPage.cursor')
  })

  test('default initialPageParam keeps legacy <= 1 previous page check', async () => {
    const source = await renderWithInfinite({
      ...infiniteConfig,
      initialPageParam: 0,
      hasExplicitInitialPageParam: false,
    })
    expect(source).toContain('getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= 1 ? undefined : firstPageParam - 1')
  })

  test('explicit initialPageParam: 0 sets <= 0 previous page check', async () => {
    const source = await renderWithInfinite({
      ...infiniteConfig,
      initialPageParam: 0,
      hasExplicitInitialPageParam: true,
    })
    expect(source).toContain('getPreviousPageParam: (_firstPage, _allPages, firstPageParam) => firstPageParam <= 0 ? undefined : firstPageParam - 1')
  })
})
