import type { Adapter, Config, PluginType } from 'kubb/kit'
import { ast, Diagnostics, memoryStorage } from 'kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperations } from '#mocks'
import { resolverClient } from '../resolver.ts'
import type { SecurityDocument } from '../builders/security.ts'
import type { Options, ResolvedOptions, ResolverClient } from '../types.ts'
import { createSdkGenerator } from './sdkGenerator.tsx'

type PluginFetch = PluginType<'plugin-fetch', Options, ResolvedOptions, ResolverClient>

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
  output: { path: '.', mode: 'directory', banner: '/* eslint-disable no-alert, no-console */' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  baseURL: undefined,
  throwOnErrorDefault: true,
  validator: false,
  returnType: 'full',
  sdk: { mode: 'tag', name: undefined },
  resolver: resolverClient,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
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
    // Only getPetById declares security in the spec, so the other methods stay bare.
    {
      name: 'sdkClassWithSecurity',
      options: { sdk: { mode: 'flat', name: 'PetStore' } } as Partial<PluginFetch['resolvedOptions']>,
      adapter: mockedAdapterWithDocument(securityDocument),
    },
    // returnType: 'data' unwraps every SDK method down to the bare success body.
    { name: 'sdkClassWithReturnTypeData', options: { returnType: 'data' } as Partial<PluginFetch['resolvedOptions']> },
    { name: 'sdkClassWithoutThrowing', options: { throwOnErrorDefault: false } as Partial<PluginFetch['resolvedOptions']> },
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

describe('sdkGenerator operations invalid options', () => {
  test('throws KUBB_INVALID_PLUGIN_OPTIONS for sdk.mode: "tag" with output.mode: "file"', async () => {
    const options: PluginFetch['resolvedOptions'] = {
      ...defaultOptions,
      output: { ...defaultOptions.output, path: 'clients.ts', mode: 'file' },
      sdk: { mode: 'tag', name: undefined },
    }
    const plugin = createMockedPlugin<PluginFetch>({ name: 'plugin-fetch', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: 'invalidSdkModeTagWithOutputModeFile',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await expect(
      renderGeneratorOperations(createSdkGenerator<PluginFetch>(), operationNodes, {
        config: testConfig,
        adapter: createMockedAdapter(),
        driver,
        plugin,
        options,
        resolver: resolverClient,
      }),
    ).rejects.toSatisfy((error: unknown) => Diagnostics.isError(error) && error.diagnostic.code === Diagnostics.code.invalidPluginOptions)
  })
})
