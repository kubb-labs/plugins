import type { Config } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverClient } from '../resolvers/resolverClient.ts'
import type { PluginClient } from '../types.ts'
import { classClientGenerator } from './classClientGenerator.tsx'

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
  paramsType: 'inline',
  paramsCasing: undefined,
  pathParamsType: 'inline',
  client: 'axios',
  clientType: 'class',
  importPath: undefined,
  parser: false,
  output: {
    path: '.',
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

const operationNodes: Array<ast.OperationNode> = [
  ast.factory.createOperation({
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
  }),
  ast.factory.createOperation({
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
  }),
  ast.factory.createOperation({
    operationId: 'deletePet',
    method: 'DELETE',
    path: '/pet/{petId}',
    tags: ['pet'],
    parameters: [
      ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
      ast.factory.createParameter({ name: 'api_key', in: 'header', schema: ast.factory.createSchema({ type: 'string' }) }),
    ],
    responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'void' }), description: 'successful operation' })],
  }),
]

describe('classClientGenerator operations', () => {
  const testData = [
    {
      name: 'findByTags',
      options: {
        group: {
          type: 'tag' as const,
          name: ({ group }: { group: string }) => `${group}Service`,
        },
        sdk: {
          className: 'PetStoreClient',
        },
      } as Partial<PluginClient['resolvedOptions']>,
    },
    {
      // No `group` config, so the default `resolveGroupName` runs. The tag `pet`
      // must produce `PetClient` (not `Pet`) so the barrel never collides with the
      // `Pet` schema model. See https://github.com/kubb-labs/plugins/issues/331.
      name: 'defaultGroupName',
      options: {
        sdk: {
          className: 'PetStoreClient',
        },
      } as Partial<PluginClient['resolvedOptions']>,
    },
  ] as const satisfies Array<{ name: string; options: Partial<PluginClient['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginClient['resolvedOptions'] = {
      ...defaultOptions,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginClient>({ name: 'plugin-client', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperations(classClientGenerator, operationNodes, {
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
