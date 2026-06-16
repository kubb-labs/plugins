/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

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
import { queryGenerator } from './queryGenerator.tsx'

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
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const updatePetWithFormNode = ast.factory.createOperation({
  operationId: 'updatePetWithForm',
  method: 'POST',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [
    ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ast.factory.createParameter({ name: 'status', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) }),
  ],
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

describe('queryGenerator operation', () => {
  const testData = [
    { name: 'findByTags', node: findByTagsNode, options: {} },
    { name: 'findByTagsTemplateString', node: findByTagsNode, options: {}, baseURL: '${123456}' },
    { name: 'findByTagsPathParamsObject', node: findByTagsNode, options: { pathParamsType: 'object' as const } },
    { name: 'findByTagsWithZod', node: findByTagsNode, options: { parser: 'zod' as const } },
    {
      name: 'findByTagsWithCustomQueryKey',
      node: findByTagsNode,
      options: {
        query: {
          methods: ['get'],
          importPath: '@tanstack/react-query',
        },
        queryKey(props) {
          const id = props.node.operationId
          const keys = queryKeyTransformer(props)
          return [`"${id}"`, ...keys]
        },
      },
    },
    { name: 'clientGetImportPath', node: findByTagsNode, options: { client: { dataReturnType: 'data' as const, importPath: 'axios' as const } } },
    { name: 'clientDataReturnTypeFull', node: findByTagsNode, options: { client: { dataReturnType: 'full' as const, client: 'axios' as const } } },
    {
      name: 'postAsQuery',
      node: updatePetWithFormNode,
      options: {
        query: {
          importPath: 'custom-query',
          methods: ['post'],
        },
      },
    },
    { name: 'findByTagsObject', node: findByTagsNode, options: { paramsType: 'object' as const, pathParamsType: 'object' as const } },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginVueQuery['resolvedOptions']>; baseURL?: string }>

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

    await renderGeneratorOperation(queryGenerator, props.node, {
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
