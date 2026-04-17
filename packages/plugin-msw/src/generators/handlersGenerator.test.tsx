import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations } from '@kubb/core/mocks'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverMsw } from '../resolvers/resolverMsw.ts'
import type { PluginMsw } from '../types.ts'
import { handlersGenerator } from './handlersGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginMsw['resolvedOptions'] = {
  output: { path: '.' },
  parser: 'data',
  baseURL: undefined,
  group: undefined,
  exclude: [],
  include: undefined,
  override: [],
  handlers: true,
  transformers: {},
  resolver: resolverMsw,
}

const operationNodes: Array<ast.OperationNode> = [
  ast.createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    responses: [
      ast.createResponse({
        statusCode: '200',
        description: 'ok',
        schema: ast.createSchema({ type: 'array', items: [ast.createSchema({ type: 'object', properties: [] })] }),
      }),
    ],
  }),
  ast.createOperation({
    operationId: 'createPets',
    method: 'POST',
    path: '/pets',
    tags: ['pets'],
    requestBody: { required: true, schema: ast.createSchema({ type: 'object', properties: [] }) },
    responses: [ast.createResponse({ statusCode: '201', description: 'created', schema: ast.createSchema({ type: 'void' }) })],
  }),
  ast.createOperation({
    operationId: 'showPetById',
    method: 'GET',
    path: '/pets/{petId}',
    tags: ['pets'],
    parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
    responses: [ast.createResponse({ statusCode: '200', description: 'ok', schema: ast.createSchema({ type: 'object', properties: [] }) })],
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
