import { ast } from 'kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { resolverClient } from '@internals/client'
import { describe, expect, test, vi } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMultiPluginDriver, matchFiles, renderGeneratorOperation, testConfig } from '#mocks'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import type { Transformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

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

const plugins = { 'plugin-ts': mockedTsPlugin, 'plugin-axios': mockedAxiosPlugin }

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

const deletePetNode = ast.factory.createOperation({
  operationId: 'deletePet',
  method: 'DELETE',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [
    ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ast.factory.createParameter({ name: 'api_key', in: 'header', schema: ast.factory.createSchema({ type: 'string' }) }),
  ],
  responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'void' }), description: 'successful operation' })],
})

const multiContentTypeNode = ast.factory.createOperation({
  operationId: 'uploadFile',
  method: 'POST',
  path: '/pet/{petId}/uploadImage',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  requestBody: {
    content: [
      ast.factory.createContent({
        contentType: 'application/json',
        schema: ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
      }),
      ast.factory.createContent({
        contentType: 'multipart/form-data',
        schema: ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'file', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
      }),
    ],
  },
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

describe('mutationGenerator operation', () => {
  const testData = [
    { name: 'getAsMutation', node: findByTagsNode, options: { mutation: { importPath: 'custom-swr/mutation', methods: ['get'] } } },
    { name: 'updatePetById', node: updatePetByIdNode, options: {} },
    { name: 'deletePet', node: deletePetNode, options: {} },
    { name: 'multiContentType', node: multiContentTypeNode, options: {} },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginReactQuery['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginReactQuery['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver(props.name, plugins)

    await renderGeneratorOperation(mutationGenerator, props.node, {
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

describe('mutationGenerator mutationKey', () => {
  test('passes the mutation variant to a custom mutationKey', async () => {
    const mutationKey = vi.fn<Transformer>(mutationKeyTransformer)
    const options: PluginReactQuery['resolvedOptions'] = { ...defaultOptions, mutationKey }
    const plugin = createMockedPlugin<PluginReactQuery>({ name: 'plugin-react-query', options, resolver: resolverReactQuery })
    const driver = createMultiPluginDriver('customMutationKey', plugins)

    await renderGeneratorOperation(mutationGenerator, updatePetByIdNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    expect(mutationKey.mock.calls.map(([props]) => props.variant)).toEqual(['mutation'])
  })
})
