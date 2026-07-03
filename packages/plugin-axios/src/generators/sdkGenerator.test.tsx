import { createSdkGenerator, resolverClient } from '@internals/client'
import type { Config } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations } from 'kubb/kit/testing'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import type { PluginAxios } from '../types.ts'

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

describe('sdkGenerator operations', () => {
  const testData = [
    { name: 'sdkClass', options: {} as Partial<PluginAxios['resolvedOptions']> },
    { name: 'sdkClassWithName', options: { sdk: { mode: 'tag', name: 'PetStore' } } as Partial<PluginAxios['resolvedOptions']> },
    { name: 'sdkSingle', options: { sdk: { mode: 'flat', name: 'PetStore' } } as Partial<PluginAxios['resolvedOptions']> },
  ] as const satisfies Array<{ name: string; options: Partial<PluginAxios['resolvedOptions']> }>

  test.each(testData)('$name', async (props) => {
    const options: PluginAxios['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginAxios>({ name: 'plugin-axios', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperations(createSdkGenerator<PluginAxios>(), operationNodes, {
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
