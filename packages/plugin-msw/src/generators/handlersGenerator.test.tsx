import type { Config } from '@kubb/core'
import { ast, memoryStorage } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations } from '@kubb/core/mocks'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverMsw } from '../resolvers/resolverMsw.ts'
import type { PluginMsw } from '../types.ts'
import { handlersGenerator } from './handlersGenerator.ts'

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

const defaultOptions: PluginMsw['resolvedOptions'] = {
  output: { path: '.' },
  parser: 'data',
  baseURL: undefined,
  group: null,
  exclude: [],
  include: undefined,
  override: [],
  handlers: true,
  resolver: resolverMsw,
}

const operationNodes: Array<ast.OperationNode> = [
  ast.factory.createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        description: 'ok',
        schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'object', properties: [] })] }),
      }),
    ],
  }),
  ast.factory.createOperation({
    operationId: 'createPets',
    method: 'POST',
    path: '/pets',
    tags: ['pets'],
    requestBody: { required: true, content: [{ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }] },
    responses: [ast.factory.createResponse({ statusCode: '201', description: 'created', schema: ast.factory.createSchema({ type: 'void' }) })],
  }),
  ast.factory.createOperation({
    operationId: 'showPetById',
    method: 'GET',
    path: '/pets/{petId}',
    tags: ['pets'],
    parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
    responses: [ast.factory.createResponse({ statusCode: '200', description: 'ok', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  }),
]

describe('handlersGenerator operations', () => {
  test('findByTags', async () => {
    const options: PluginMsw['resolvedOptions'] = {
      ...defaultOptions,
    }
    const plugin = createMockedPlugin<PluginMsw>({ name: 'plugin-msw', options, resolver: resolverMsw })
    const driver = createMockedPluginDriver({ name: 'findByTags' })

    await renderGeneratorOperations(handlersGenerator, operationNodes, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverMsw,
    })

    await matchFiles(driver.fileManager.files, 'findByTags')
  })
})
