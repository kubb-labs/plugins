import { ast } from '@kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'
import { resolverZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, rawSources, renderGeneratorOperations, testConfig } from '#mocks'
import { resolverMcp } from '../resolvers/resolverMcp.ts'
import type { PluginMcp } from '../types.ts'
import { serverGenerator } from './serverGenerator.tsx'

const defaultOptions: PluginMcp['resolvedOptions'] = {
  output: { path: '.', mode: 'directory' },
  exclude: [],
  include: undefined,
  override: [],
  client: { kind: 'contract', pluginName: 'plugin-axios' },
  group: null,
  resolver: resolverMcp,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const mockedZodPlugin = createMockedPlugin<PluginZod>({
  name: 'plugin-zod',
  options: { output: { path: '.', mode: 'directory' }, group: null } as PluginZod['resolvedOptions'],
  resolver: resolverZod,
})

describe('serverGenerator — Operations', () => {
  const nodes: Array<ast.OperationNode> = [
    ast.factory.createOperation({
      operationId: 'showPetById',
      method: 'GET',
      path: '/pets/{petId}',
      tags: ['pets'],
      parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          schema: ast.factory.createSchema({ type: 'object', properties: [] }),
          description: 'Expected response',
        }),
      ],
    }),
    ast.factory.createOperation({
      operationId: 'getCookies',
      method: 'GET',
      path: '/cookies',
      tags: ['cookies'],
      parameters: [ast.factory.createParameter({ name: 'session', in: 'cookie', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          schema: ast.factory.createSchema({ type: 'object', properties: [] }),
          description: 'The cookies the request sent',
        }),
      ],
    }),
  ]

  test('showPetById', async () => {
    const driver = await renderServer(nodes)

    await matchFiles(driver.fileManager.files, 'showPetById')
  })
})

async function renderServer(nodes: Array<ast.OperationNode>) {
  const plugin = createMockedPlugin<PluginMcp>({ name: 'plugin-mcp', options: defaultOptions, resolver: resolverMcp })
  const driver = createMockedPluginDriver({
    name: 'showPetById',
    plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
  })
  // Also register zod plugin — serverGenerator needs it for zod schema imports
  const originalGetPlugin = driver.getPlugin.bind(driver)
  driver.getPlugin = ((pluginName: string) => {
    if (pluginName === 'plugin-zod') return mockedZodPlugin
    return originalGetPlugin(pluginName)
  }) as typeof driver.getPlugin

  driver.getResolver = ((pluginName: string) => {
    if (pluginName === 'plugin-zod') return mockedZodPlugin.resolver
    return mockedTsPlugin.resolver
  }) as typeof driver.getResolver

  await renderGeneratorOperations(serverGenerator, nodes, {
    config: testConfig,
    adapter: createMockedAdapter(),
    driver,
    plugin,
    options: defaultOptions,
    resolver: resolverMcp,
  })

  return driver
}

describe('serverGenerator — stream and querystring operations', () => {
  const filter = ast.factory.createSchema({
    type: 'object',
    properties: [ast.factory.createProperty({ name: 'term', schema: ast.factory.createSchema({ type: 'string' }) })],
  })
  const listItems = (contentType: string) =>
    ast.factory.createOperation({
      operationId: 'listItems',
      method: 'GET',
      path: '/items',
      parameters: [ast.factory.createParameter({ name: 'filter', in: 'querystring', schema: filter, contentType })],
      responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
    })

  test('registers no tool for a stream operation', async () => {
    const stream = ast.factory.createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [ast.factory.createResponse({ statusCode: '200', mediaType: 'text/event-stream', schema: ast.factory.createSchema({ type: 'object' }) })],
    })
    const source = rawSources((await renderServer([stream])).fileManager.files).join('\n')

    expect(source).not.toContain('streamEvents')
  })

  test('takes a form-encoded querystring as the grouped query schema plugin-zod emits', async () => {
    const source = rawSources((await renderServer([listItems('application/x-www-form-urlencoded')])).fileManager.files).join('\n')

    expect(source).toContain('query: listItemsQuerySchema')
    expect(source).not.toContain('listItemsQueryTermSchema')
  })

  test('keeps a JSON querystring as its own parameter schema', async () => {
    const source = rawSources((await renderServer([listItems('application/json')])).fileManager.files).join('\n')

    expect(source).toContain('query: z.object({ "filter": listItemsQuerystringFilterSchema })')
  })
})
