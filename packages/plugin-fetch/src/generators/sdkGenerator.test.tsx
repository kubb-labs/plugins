import { createSdkGenerator, resolverClient, type SecurityDocument } from '@internals/client'
import type { Adapter, Config } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations } from 'kubb/kit/testing'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import type { PluginFetch } from '../types.ts'

const testConfig: Config = {
  root: '.',
  input: '',
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  reporters: [],
  adapter: createMockedAdapter(),
  storage: memoryStorage(),
}

const defaultOptions: PluginFetch['resolvedOptions'] = {
  output: { path: '.', banner: '/* eslint-disable no-alert, no-console */' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  baseURL: undefined,
  validator: false,
  sdk: { mode: 'tag', name: undefined },
  resolver: resolverClient,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const operationNodes: Array<ast.OperationNode> = [
  ast.factory.createOperation({
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
  }),
  ast.factory.createOperation({
    operationId: 'deletePet',
    method: 'DELETE',
    path: '/pet/{petId}',
    tags: ['pet'],
    parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'integer' }), required: true })],
    responses: [ast.factory.createResponse({ statusCode: '204', schema: ast.factory.createSchema({ type: 'void' }), description: 'no content' })],
  }),
  ast.factory.createOperation({
    operationId: 'getInventory',
    method: 'GET',
    path: '/store/inventory',
    tags: ['store'],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        schema: ast.factory.createSchema({ type: 'object', properties: [] }),
        description: 'successful operation',
      }),
    ],
  }),
  // Snake_case path param: the emitted url must be camelCased to match the grouped `path` keys.
  ast.factory.createOperation({
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
  }),
]

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

describe('sdkGenerator operations', () => {
  const testData = [
    { name: 'sdkClass', options: {} as Partial<PluginFetch['resolvedOptions']> },
    { name: 'sdkClassWithName', options: { sdk: { mode: 'tag', name: 'PetStore' } } as Partial<PluginFetch['resolvedOptions']> },
    { name: 'sdkSingle', options: { sdk: { mode: 'flat', name: 'PetStore' } } as Partial<PluginFetch['resolvedOptions']> },
    // Only getPetById declares security in the spec, so the other methods stay bare.
    {
      name: 'sdkClassWithSecurity',
      options: { sdk: { mode: 'flat', name: 'PetStore' } } as Partial<PluginFetch['resolvedOptions']>,
      adapter: mockedAdapterWithDocument(securityDocument),
    },
  ] as const satisfies Array<{ name: string; options: Partial<PluginFetch['resolvedOptions']>; adapter?: Adapter }>

  test.each(testData)('$name', async (props) => {
    const options: PluginFetch['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginFetch>({ name: 'plugin-fetch', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperations(createSdkGenerator<PluginFetch>(), operationNodes, {
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
