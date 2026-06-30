import { resolverClient, type SecurityDocument } from '@internals/client'
import type { Adapter, Config } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import type { PluginAxios } from '../types.ts'
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

const defaultOptions: PluginAxios['resolvedOptions'] = {
  output: { path: '.', banner: '/* eslint-disable no-alert, no-console */' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  baseURL: undefined,
  validator: false,
  sdk: undefined,
  resolver: resolverClient,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const findPetsByTagsNode = ast.factory.createOperation({
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
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'integer' }), required: true })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const getProjectNode = ast.factory.createOperation({
  operationId: 'getProject',
  method: 'GET',
  path: '/projects/{project_id}',
  tags: ['project'],
  parameters: [ast.factory.createParameter({ name: 'project_id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
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
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'integer' }), required: true })],
  responses: [ast.factory.createResponse({ statusCode: '204', schema: ast.factory.createSchema({ type: 'void' }), description: 'no content' })],
})

const createPetNode = ast.factory.createOperation({
  operationId: 'addPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  requestBody: {
    required: true,
    content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  },
  responses: [
    ast.factory.createResponse({ statusCode: '201', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Pet created' }),
    ast.factory.createResponse({ statusCode: '405', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
  ],
})

const listPetsStyledNode = ast.factory.createOperation({
  operationId: 'listPetsStyled',
  method: 'GET',
  path: '/pets/{petId}',
  tags: ['pet'],
  parameters: [
    ast.factory.createParameter({
      name: 'petId',
      in: 'path',
      schema: ast.factory.createSchema({ type: 'integer' }),
      required: true,
      style: 'matrix',
      explode: true,
    }),
    ast.factory.createParameter({
      name: 'tags',
      in: 'query',
      schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] }),
      required: false,
      style: 'pipeDelimited',
      explode: false,
    }),
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const streamEventsNode = ast.factory.createOperation({
  operationId: 'streamEvents',
  method: 'GET',
  path: '/events',
  tags: ['events'],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      mediaType: 'text/event-stream',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'event stream',
    }),
  ],
})

const securityDocument: SecurityDocument = {
  components: {
    securitySchemes: {
      petstore_auth: { type: 'oauth2' },
      api_key: { type: 'apiKey', name: 'api_key', in: 'header' },
    },
  },
  paths: {
    '/pet/{petId}': {
      get: { security: [{ petstore_auth: ['read:pets'] }, { api_key: [] }] },
    },
  },
}

function mockedAdapterWithDocument(document: SecurityDocument): Adapter {
  return { ...createMockedAdapter(), document } as Adapter
}

describe('clientGenerator operation', () => {
  const testData = [
    { name: 'findPetsByTags', node: findPetsByTagsNode, options: {} },
    { name: 'getPetById', node: getPetByIdNode, options: {} },
    // Snake_case path param: the emitted url must be camelCased to match the grouped `path` keys.
    { name: 'getProject', node: getProjectNode, options: {} },
    { name: 'deletePetNoContent', node: deletePetNode, options: {} },
    { name: 'addPetMultiStatus', node: createPetNode, options: {} },
    // Parameter style/explode flows from the ParameterNode into a `styles` call-config entry.
    { name: 'listPetsWithStyles', node: listPetsStyledNode, options: {} },
    // text/event-stream response returns a typed event stream instead of a one-shot result.
    { name: 'streamEventsSse', node: streamEventsNode, options: {} },
    { name: 'addPetMultiStatusWithZod', node: createPetNode, options: { validator: 'zod' as const } },
    // Two requirements referencing two schemes (oauth2 bearer + apiKey header).
    { name: 'getPetByIdWithSecurity', node: getPetByIdNode, options: {}, adapter: mockedAdapterWithDocument(securityDocument) },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options: Partial<PluginAxios['resolvedOptions']>; adapter?: Adapter }>

  test.each(testData)('$name', async (props) => {
    const options: PluginAxios['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginAxios>({ name: 'plugin-axios', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(clientGenerator, props.node, {
      config: testConfig,
      adapter: 'adapter' in props ? props.adapter : createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})
