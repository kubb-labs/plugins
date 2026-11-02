import { ast } from '@kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { resolverClient } from '@internals/client'
import { describe, expect, test, vi } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMultiPluginDriver, matchFiles, renderGeneratorOperation, testConfig } from '#mocks'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import type { Transformer } from '@internals/tanstack-query'
import { resolverVueQuery } from '../resolvers/resolverVueQuery.ts'
import type { PluginVueQuery } from '../types.ts'
import { infiniteQueryGenerator } from './infiniteQueryGenerator.tsx'

const defaultOptions: PluginVueQuery['resolvedOptions'] = {
  client: { kind: 'contract', pluginName: 'plugin-axios' },
  queryKey: queryKeyTransformer,
  mutationKey: mutationKeyTransformer,
  query: {
    importPath: '@tanstack/react-query',
    methods: ['GET'],
  },
  mutation: {
    methods: ['POST'],
    importPath: '@tanstack/react-query',
  },
  infinite: false,
  output: { path: '.', mode: 'directory' },
  group: null,
  exclude: [],
  include: undefined,
  override: [],
  hooks: true,
  resolver: resolverVueQuery,
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

const plugins = { 'plugin-ts': mockedTsPlugin, 'plugin-axios': mockedAxiosPlugin }

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
    ast.factory.createParameter({ name: 'pageSize', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'object', properties: [] })] }),
      description: 'successful operation',
    }),
  ],
})

const infiniteOptions = {
  queryParam: 'pageSize',
  initialPageParam: 0,
  cursorParam: null,
} as const

describe('infiniteQueryGenerator operation', () => {
  const testData = [
    { name: 'findInfiniteByTags', node: findByTagsNode, options: { infinite: infiniteOptions } },
    {
      name: 'findInfiniteByTagsCursor',
      node: findByTagsNode,
      options: { infinite: { ...infiniteOptions, cursorParam: 'cursor' as const } },
    },
    {
      name: 'findInfiniteByTagsPageParamCode',
      node: findByTagsNode,
      options: {
        infinite: {
          ...infiniteOptions,
          getNextPageParam: '(lastPage) => (lastPage.hasNext ? lastPage.number + 1 : undefined)',
          getPreviousPageParam: '(firstPage) => (firstPage.number > 0 ? firstPage.number - 1 : undefined)',
        },
      },
    },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginVueQuery['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginVueQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginVueQuery>({ name: 'plugin-vue-query', options, resolver: resolverVueQuery })
    const driver = createMultiPluginDriver(props.name, plugins)

    await renderGeneratorOperation(infiniteQueryGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverVueQuery,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('infiniteQueryGenerator operation with hooks disabled', () => {
  test('returns no file when hooks is false', async () => {
    const options: PluginVueQuery['resolvedOptions'] = {
      ...defaultOptions,
      infinite: infiniteOptions,
      hooks: false,
    }
    const plugin = createMockedPlugin<PluginVueQuery>({ name: 'plugin-vue-query', options, resolver: resolverVueQuery })
    const driver = createMultiPluginDriver('hooksDisabled', plugins)

    await renderGeneratorOperation(infiniteQueryGenerator, findByTagsNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverVueQuery,
    })

    expect(driver.fileManager.files).toStrictEqual([])
  })
})

describe('infiniteQueryGenerator queryKey', () => {
  test('passes the infiniteQuery variant to a custom queryKey', async () => {
    const queryKey = vi.fn<Transformer>(queryKeyTransformer)
    const options: PluginVueQuery['resolvedOptions'] = { ...defaultOptions, infinite: infiniteOptions, queryKey }
    const plugin = createMockedPlugin<PluginVueQuery>({ name: 'plugin-vue-query', options, resolver: resolverVueQuery })
    const driver = createMultiPluginDriver('customQueryKey', plugins)

    await renderGeneratorOperation(infiniteQueryGenerator, findByTagsNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverVueQuery,
    })

    expect(queryKey.mock.calls.map(([props]) => props.variant)).toEqual(['infiniteQuery'])
  })
})
