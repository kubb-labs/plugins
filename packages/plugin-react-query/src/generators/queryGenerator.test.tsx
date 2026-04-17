/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { MutationKey, QueryKey } from '../components'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { queryGenerator } from './queryGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginReactQuery['resolvedOptions'] = {
  client: {
    dataReturnType: 'data',
    client: 'axios',
    clientType: 'function',
    bundle: false,
  },
  parser: 'zod',
  paramsCasing: undefined,
  paramsType: 'inline',
  pathParamsType: 'inline',
  queryKey: QueryKey.getTransformer,
  mutationKey: MutationKey.getTransformer,
  query: {
    importPath: '@tanstack/react-query',
    methods: ['get'],
  },
  mutation: {
    methods: ['post', 'put', 'patch', 'delete'],
    importPath: '@tanstack/react-query',
  },
  suspense: false,
  infinite: false,
  customOptions: undefined,
  exclude: [],
  include: undefined,
  override: [],
  output: { path: '.' },
  group: undefined,
  resolver: resolverReactQuery,
  transformers: {},
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

// Shared operation nodes
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
    ast.createParameter({ name: 'status', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
    ast.createParameter({ name: 'pageSize', in: 'query', schema: ast.createSchema({ type: 'string' }) }),
  ],
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const getPetByIdNode = ast.createOperation({
  operationId: 'getPetById',
  method: 'GET',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
  responses: [
    ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' }),
    ast.createResponse({ statusCode: '400', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Invalid ID supplied' }),
  ],
})

const findByStatusNode = ast.createOperation({
  operationId: 'findPetsByStatus',
  method: 'GET',
  path: '/pet/findByStatus',
  tags: ['pet'],
  parameters: [ast.createParameter({ name: 'status', in: 'query', schema: ast.createSchema({ type: 'string' }) })],
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const createUsersWithListInputNode = ast.createOperation({
  operationId: 'createUsersWithListInput',
  method: 'POST',
  path: '/user/createWithList',
  tags: ['user'],
  requestBody: { schema: ast.createSchema({ type: 'object', properties: [] }) },
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

describe('queryGenerator operation', () => {
  const testData = [
    { name: 'findByTags', node: findByTagsNode, options: {} },
    { name: 'findByTagsTemplateString', node: findByTagsNode, options: {}, baseURL: '${123456}' },
    { name: 'findByTagsWithZod', node: findByTagsNode, options: { parser: 'zod' as const } },
    { name: 'findByTagsFull', node: findByTagsNode, options: { client: { dataReturnType: 'full' as const, client: 'axios' as const } } },
    { name: 'clientPostImportPath', node: findByTagsNode, options: { client: { dataReturnType: 'data' as const, importPath: 'axios' as const } } },
    { name: 'getPetById', node: getPetByIdNode, options: {} },
    { name: 'getPetIdCamelCase', node: getPetByIdNode, options: { paramsCasing: 'camelcase' as const } },
    { name: 'findByTagsObject', node: findByTagsNode, options: { paramsType: 'object' as const, pathParamsType: 'object' as const } },
    { name: 'findByStatusAllOptional', node: findByStatusNode, options: { paramsType: 'object' as const } },
    { name: 'findByStatusAllOptionalInline', node: findByStatusNode, options: { paramsType: 'inline' as const } },
    {
      name: 'createUsersWithListInputAsQuery',
      node: createUsersWithListInputNode,
      options: { query: { importPath: '@tanstack/react-query', methods: ['post'] } },
    },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginReactQuery['resolvedOptions']>; baseURL?: string }>

  test.each(testData)('$name', async (props) => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMockedPluginDriver({ name: props.name, plugin: mockedTsPlugin })

    await renderGeneratorOperation(queryGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter({
        inputNode: { kind: 'Input', schemas: [], operations: [], meta: { baseURL: 'baseURL' in props ? props.baseURL : undefined } },
      }),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
