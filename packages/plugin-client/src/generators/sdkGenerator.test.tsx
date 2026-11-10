import { createGroupConfig } from '@internals/shared'
import type { Config, PluginType } from '@kubb/kit'
import { ast, Diagnostics, memoryStorage } from '@kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperations } from '#mocks'
import { resolverClient } from '../resolver.ts'
import type { ClientOptions, ClientResolvedOptions, ResolverClient } from '../types.ts'
import { createSdkGenerator } from './sdkGenerator.tsx'

type PluginFetch = PluginType<'plugin-fetch', ClientOptions, ClientResolvedOptions, ResolverClient>

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

describe('sdkGenerator operations', () => {
  const testData = [
    // Only getPetById declares security in the spec, so the other methods stay bare.
    // returnType: 'data' unwraps every SDK method down to the bare success body.
    { name: 'sdkClassWithReturnTypeData', options: { returnType: 'data' } as Partial<PluginFetch['resolvedOptions']> },
    { name: 'sdkClassWithoutThrowing', options: { throwOnErrorDefault: false } as Partial<PluginFetch['resolvedOptions']> },
    // `group.name` names the folders; the classes keep `resolver.groupName`, and the root shares one client.
    {
      name: 'sdkTagGroupWithRoot',
      options: { group: createGroupConfig({ type: 'tag' }), sdk: { mode: 'tag', name: 'petStore' } } as Partial<PluginFetch['resolvedOptions']>,
    },
    // An operation-level `servers` entry wins over the path's and becomes that method's default `baseURL`.
    {
      name: 'sdkClassWithOperationServer',
      options: {},
      nodes: operationNodes.map((node) => (node.path === '/store/inventory' ? { ...node, servers: [{ url: 'https://inventory.example.com' }] } : node)),
    },
    // One method with declared response headers next to methods without: the class imports both result types.
    {
      name: 'sdkClassWithResponseHeaders',
      options: {},
      nodes: operationNodes.map((node) =>
        node.operationId === 'deletePet'
          ? {
              ...node,
              responses: node.responses.map((response) => ({
                ...response,
                headers: [
                  ast.factory.createParameter({ name: 'X-Request-Id', in: 'header', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
                ],
              })),
            }
          : node,
      ),
    },
  ] as const satisfies Array<{ name: string; options: Partial<PluginFetch['resolvedOptions']>; nodes?: Array<ast.OperationNode> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginFetch['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginFetch>({ name: 'plugin-fetch', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperations(createSdkGenerator<PluginFetch>(), 'nodes' in props ? props.nodes : operationNodes, {
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
