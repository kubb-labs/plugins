/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
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

const defaultOptions: PluginReactQuery['resolvedOptions'] = {
  client: { kind: 'contract-inline', client: 'axios' },
  parser: 'zod',
  queryKey: queryKeyTransformer,
  mutationKey: mutationKeyTransformer,
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
  customOptions: null,
  exclude: [],
  include: undefined,
  override: [],
  output: { path: '.' },
  group: null,
  resolver: resolverReactQuery,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

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

const findByStatusNode = ast.factory.createOperation({
  operationId: 'findPetsByStatus',
  method: 'GET',
  path: '/pet/findByStatus',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'status', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const createUsersWithListInputNode = ast.factory.createOperation({
  operationId: 'createUsersWithListInput',
  method: 'POST',
  path: '/user/createWithList',
  tags: ['user'],
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
    { name: 'findByTagsWithZod', node: findByTagsNode, options: { parser: 'zod' as const } },
    {
      name: 'clientPostImportPath',
      node: findByTagsNode,
      options: { client: { kind: 'contract-inline', client: 'axios' } },
    },
    { name: 'getPetById', node: getPetByIdNode, options: {} },
    { name: 'findByStatusAllOptional', node: findByStatusNode, options: {} },
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
      resolver: resolverReactQuery,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
