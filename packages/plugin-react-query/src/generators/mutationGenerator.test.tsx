import type { Config } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { matchFiles, rawSources } from '#mocks'
import { mutationKeyTransformer, queryKeyTransformer } from '@internals/tanstack-query'
import { resolverReactQuery } from '../resolvers/resolverReactQuery.ts'
import type { PluginReactQuery } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

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

const updatePetByIdNode = ast.createOperation({
  operationId: 'updatePetWithForm',
  method: 'POST',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
  requestBody: { content: [{ contentType: 'application/json', schema: ast.createSchema({ type: 'object', properties: [] }) }] },
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

const deletePetNode = ast.createOperation({
  operationId: 'deletePet',
  method: 'DELETE',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [
    ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true }),
    ast.createParameter({ name: 'api_key', in: 'header', schema: ast.createSchema({ type: 'string' }) }),
  ],
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'void' }), description: 'successful operation' })],
})

const multiContentTypeNode = ast.createOperation({
  operationId: 'uploadFile',
  method: 'POST',
  path: '/pet/{petId}/uploadImage',
  tags: ['pet'],
  parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
  requestBody: {
    content: [
      {
        contentType: 'application/json',
        schema: ast.createSchema({
          type: 'object',
          properties: [ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) })],
        }),
      },
      {
        contentType: 'multipart/form-data',
        schema: ast.createSchema({
          type: 'object',
          properties: [ast.createProperty({ name: 'file', required: true, schema: ast.createSchema({ type: 'string' }) })],
        }),
      },
    ],
  },
  responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'successful operation' })],
})

describe('mutationGenerator operation', () => {
  const testData = [
    { name: 'getAsMutation', node: findByTagsNode, options: { mutation: { importPath: 'custom-swr/mutation', methods: ['get'] } } },
    { name: 'clientPostImportPath', node: updatePetByIdNode, options: { client: { dataReturnType: 'data' as const, importPath: 'axios' as const } } },
    { name: 'updatePetById', node: updatePetByIdNode, options: {} },
    { name: 'updatePetByIdPathParamsObject', node: updatePetByIdNode, options: { pathParamsType: 'object' as const } },
    { name: 'deletePet', node: deletePetNode, options: {} },
    { name: 'deletePetObject', node: deletePetNode, options: { pathParamsType: 'object' as const } },
    { name: 'multiContentType', node: multiContentTypeNode, options: {} },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginReactQuery['resolvedOptions']> }>

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

    await renderGeneratorOperation(mutationGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverReactQuery,
    })

    for (const source of rawSources(driver.fileManager.files)) {
      expect(source, 'raw output has no double blank lines').not.toMatch(/\n[ \t]*\n[ \t]*\n/)
      expect(source, 'raw output has no blank line right after an opening bracket').not.toMatch(/[([{][ \t]*\n[ \t]*\n/)
    }

    await matchFiles(driver.fileManager.files, props.name)
  })
})
