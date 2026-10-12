import type { Config } from 'kubb/kit'
import { ast, createResolver, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations } from 'kubb/kit/testing'
import { describe, expect, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverMsw } from '../resolvers/resolverMsw.ts'
import type { PluginMsw } from '../types.ts'
import { handlersGenerator } from './handlersGenerator.ts'

const testConfig: Config = {
  root: '.',
  input: {},
  output: { path: 'test' },
  plugins: [],
  parsers: [],
  reporters: [],
  adapter: createMockedAdapter(),
  storage: memoryStorage(),
}

const defaultOptions: PluginMsw['resolvedOptions'] = {
  output: { path: '.', mode: 'directory' },
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
    requestBody: {
      required: true,
      content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
    },
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

  test('custom listName resolver generates custom createListName', async () => {
    const customResolver = createResolver<PluginMsw>({
      pluginName: 'plugin-msw',
      handler: {
        name(node) {
          return resolverMsw.handler.name(node)
        },
        listName: () => 'petHandlers',
      },
    })
    const options: PluginMsw['resolvedOptions'] = {
      ...defaultOptions,
      resolver: customResolver,
    }
    const plugin = createMockedPlugin<PluginMsw>({ name: 'plugin-msw', options, resolver: customResolver })
    const driver = createMockedPluginDriver({ name: 'customListName' })

    await renderGeneratorOperations(handlersGenerator, operationNodes, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: customResolver,
    })

    const handlersFile = driver.fileManager.files[0]
    const content =
      handlersFile?.sources
        ?.flatMap((s) => s.nodes)
        .map((n) => ('value' in n ? (n as { value: string }).value : ''))
        .join('\n') ?? ''
    expect(content).toContain('export function createPetHandlers(options?: { baseURL?: string })')
    expect(content).toContain('export const petHandlers = createPetHandlers()')
  })
})
