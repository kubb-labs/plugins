import type { Config } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { mutationKeyTransformer } from '@internals/tanstack-query'
import { queryKeyTransformer } from '@internals/tanstack-query'
import { resolverVueQuery } from '../resolvers/resolverVueQuery.ts'
import type { PluginVueQuery } from '../types.ts'
import { infiniteQueryGenerator } from './infiniteQueryGenerator.tsx'

const testConfig: Config = {
  root: '.',
  input: { path: '' },
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  reporters: [],
  adapter: createMockedAdapter(),
  storage: memoryStorage(),
}

const defaultOptions: PluginVueQuery['resolvedOptions'] = {
  client: {
    dataReturnType: 'data',
    client: 'axios',
    clientType: 'function',
    importPath: undefined,
    bundle: false,
  },
  parser: 'zod',
  paramsType: 'inline',
  paramsCasing: undefined,
  pathParamsType: 'inline',
  queryKey: queryKeyTransformer,
  mutationKey: mutationKeyTransformer,
  query: {
    importPath: '@tanstack/react-query',
    methods: ['get'],
  },
  mutation: {
    methods: ['post'],
    importPath: '@tanstack/react-query',
  },
  infinite: false,
  output: { path: '.' },
  group: null,
  exclude: [],
  include: undefined,
  override: [],
  resolver: resolverVueQuery,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const findByTagsNode = ast.createOperation({
  operationId: 'findPetsByTags',
  method: 'GET',
  path: '/pet/findByTags',
  tags: ['pet'],
  parameters: [
    ast.createParameter({
      name: 'tags',
      in: 'query',
      schema: ast.createSchema({ type: 'array', items: [ast.createSchema({ type: 'string' })] }),
      required: true,
    }),
    ast.createParameter({ name: 'pageSize', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
  ],
  responses: [
    ast.createResponse({
      statusCode: '200',
      schema: ast.createSchema({ type: 'array', items: [ast.createSchema({ type: 'object', properties: [] })] }),
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
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginVueQuery['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginVueQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginVueQuery>({ name: 'plugin-vue-query', options, resolver: resolverVueQuery })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

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
