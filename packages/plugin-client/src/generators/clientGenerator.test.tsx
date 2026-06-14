/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverClient } from '../resolvers/resolverClient.ts'
import type { PluginClient } from '../types.ts'
import { clientGenerator } from './clientGenerator.tsx'

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

const defaultOptions: PluginClient['resolvedOptions'] = {
  dataReturnType: 'data',
  paramsCasing: undefined,
  paramsType: 'inline',
  pathParamsType: 'inline',
  client: 'axios',
  clientType: 'function',
  importPath: undefined,
  bundle: false,
  parser: false,
  output: {
    path: '.',
    banner: '/* eslint-disable no-alert, no-console */',
  },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  urlType: 'export',
  sdk: undefined,
  baseURL: undefined,
  resolver: resolverClient,
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
  requestBody: { content: [{ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }] },
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

const uploadFileNode = ast.factory.createOperation({
  operationId: 'uploadFile',
  method: 'POST',
  path: '/pet/{petId}/uploadImage',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  requestBody: { content: [{ contentType: 'multipart/form-data', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }] },
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
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

const requiredOneOfRequestBodyNode = ast.factory.createOperation({
  operationId: 'createOrder',
  method: 'POST',
  path: '/orders',
  tags: ['store'],
  requestBody: {
    required: true,
    content: [
      {
        contentType: 'application/json',
        schema: ast.factory.createSchema({
          type: 'union',
          schemas: [ast.factory.createSchema({ type: 'object', properties: [] }), ast.factory.createSchema({ type: 'string' })],
        }),
      },
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

const multiContentTypeNode = ast.factory.createOperation({
  operationId: 'uploadFile',
  method: 'POST',
  path: '/pet/{petId}/uploadImage',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  requestBody: {
    content: [
      {
        contentType: 'application/json',
        schema: ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
      },
      {
        contentType: 'multipart/form-data',
        schema: ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'file', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
      },
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

const dashedPathParamsNode = ast.factory.createOperation({
  operationId: 'getOrganization',
  method: 'GET',
  path: '/organizations/{organization-id}',
  tags: ['organizations'],
  parameters: [ast.factory.createParameter({ name: 'organization-id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const underscoredPathParamsNode = ast.factory.createOperation({
  operationId: 'getItem',
  method: 'GET',
  path: '/v1/items/{item_id}',
  tags: ['items'],
  parameters: [ast.factory.createParameter({ name: 'item_id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const multiStatusNode = ast.factory.createOperation({
  operationId: 'createPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  requestBody: { content: [{ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }] },
  responses: [
    ast.factory.createResponse({ statusCode: '201', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Pet created' }),
    ast.factory.createResponse({ statusCode: '405', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
  ],
})

const downloadFileNode = ast.factory.createOperation({
  operationId: 'downloadFile',
  method: 'GET',
  path: '/files/{fileId}',
  tags: ['files'],
  parameters: [ast.factory.createParameter({ name: 'fileId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      description: 'The file',
      schema: ast.factory.createSchema({ type: 'string' }),
      content: [{ contentType: 'application/octet-stream', schema: ast.factory.createSchema({ type: 'string' }) }],
    }),
  ],
})

describe('clientGenerator operation', () => {
  const testData = [
    { name: 'findByTags', node: findByTagsNode, options: {} },
    { name: 'findByTagsWithTemplateString', node: findByTagsNode, options: {}, baseURL: '${123456}' },
    { name: 'findByTagsWithZod', node: findByTagsNode, options: { parser: 'zod' as const } },
    { name: 'findByTagsWithZodRequest', node: findByTagsNode, options: { parser: { request: 'zod' } as const } },
    { name: 'findByTagsWithZodBoth', node: findByTagsNode, options: { parser: { request: 'zod', response: 'zod' } as const } },
    { name: 'findByTagsFull', node: findByTagsNode, options: { dataReturnType: 'full' as const } },
    { name: 'findByTagsWithZodFull', node: findByTagsNode, options: { parser: 'zod' as const, dataReturnType: 'full' as const } },
    { name: 'multiStatusFull', node: multiStatusNode, options: { dataReturnType: 'full' as const } },
    { name: 'multiStatusWithZodFull', node: multiStatusNode, options: { parser: 'zod' as const, dataReturnType: 'full' as const } },
    { name: 'updatePetByIdWithZodRequest', node: updatePetByIdNode, options: { parser: { request: 'zod' } as const } },
    { name: 'importPath', node: findByTagsNode, options: { importPath: 'axios' as const } },
    { name: 'findByTagsObject', node: findByTagsNode, options: { paramsType: 'object' as const, pathParamsType: 'object' as const } },
    { name: 'updatePetById', node: updatePetByIdNode, options: {} },
    { name: 'deletePet', node: deletePetNode, options: {} },
    { name: 'deletePetObject', node: deletePetNode, options: { pathParamsType: 'object' as const } },
    { name: 'updatePetByIdClean', node: updatePetByIdNode, options: { urlType: false as const } },
    { name: 'uploadFile', node: uploadFileNode, options: {} },
    { name: 'findByTagsWithBaseURL', node: findByTagsNode, options: {}, baseURL: 'https://petstore3.swagger.io/api/v3' },
    { name: 'findByStatusAllOptional', node: findByStatusNode, options: { paramsType: 'object' as const, pathParamsType: 'object' as const } },
    { name: 'findByStatusAllOptionalInline', node: findByStatusNode, options: { paramsType: 'inline' as const, pathParamsType: 'inline' as const } },
    { name: 'requiredOneOfRequestBody', node: requiredOneOfRequestBodyNode, options: {} },
    { name: 'multiContentType', node: multiContentTypeNode, options: {} },
    { name: 'downloadFileBlob', node: downloadFileNode, options: {} },
    { name: 'dashedPathParams', node: dashedPathParamsNode, options: { paramsCasing: 'camelcase' as const, pathParamsType: 'object' as const } },
    { name: 'dashedPathParamsInline', node: dashedPathParamsNode, options: { paramsCasing: 'camelcase' as const, pathParamsType: 'inline' as const } },
    { name: 'underscoredPathParams', node: underscoredPathParamsNode, options: { paramsCasing: 'camelcase' as const, pathParamsType: 'object' as const } },
    {
      name: 'underscoredPathParamsInline',
      node: underscoredPathParamsNode,
      options: { paramsCasing: 'camelcase' as const, pathParamsType: 'inline' as const },
    },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginClient['resolvedOptions']>; baseURL?: string }>

  test.each(testData)('$name', async (props) => {
    const options: PluginClient['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
      ...('baseURL' in props ? { baseURL: props.baseURL } : {}),
    }
    const plugin = createMockedPlugin<PluginClient>({ name: 'plugin-client', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(clientGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
