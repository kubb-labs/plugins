import { ast } from '@internals/ast'
import { stripTypeScriptTypes } from 'node:module'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'
import { resolverZod } from '@kubb/plugin-zod'
import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, rawSources, renderTemplate, testConfig } from '#mocks'
import { resolverMcp } from '../resolvers/resolverMcp.ts'
import type { PluginMcp } from '../types.ts'
import { serverOperations } from './server.tsx'

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

describe('serverGenerator — client plugin filter', () => {
  test('registers no tool for an operation the client plugin excludes', async () => {
    const operation = (operationId: string) => ast.factory.createOperation({ operationId, method: 'GET', path: `/${operationId}`, responses: [] })
    const driver = await renderServer([operation('ping'), operation('pong')], { exclude: [{ type: 'operationId', pattern: 'pong' }] })
    const source = rawSources(driver.fileManager.files).join('\n')

    expect(source).toContain('pingHandler')
    expect(source).not.toContain('pongHandler')
  })
})

describe('serverGenerator — tool names', () => {
  test('replaces characters MCP clients reject, cuts the name at 64 characters and keeps names unique', async () => {
    const long = 'a'.repeat(64)
    const operationIds = ['pets.list/v2', 'pets.list', 'pets/list', 'pets_list_2', `${long}b`, `${long}c`]
    const nodes = operationIds.map((operationId, index) => ast.factory.createOperation({ operationId, method: 'GET', path: `/tools/${index}`, responses: [] }))
    const source = rawSources((await renderServer(nodes)).fileManager.files).join('\n')

    expect([...source.matchAll(/registerTool\("([^"]+)"/g)].map((match) => match[1])).toEqual([
      'pets_list_v2',
      'pets_list',
      'pets_list_2',
      'pets_list_2_2',
      long,
      `${'a'.repeat(62)}_2`,
    ])
  })
})

describe('serverGenerator — tool schemas', () => {
  test('lists a tool whose schema holds a bigint or a Blob', async () => {
    const source = rawSources(
      (await renderServer([ast.factory.createOperation({ operationId: 'ping', method: 'GET', path: '/ping', responses: [] })])).fileManager.files,
    ).join('\n')
    const helper = source.slice(source.indexOf('function toolSchema'), source.indexOf('export function getServer'))
    const toolSchema = new Function('z', `${stripTypeScriptTypes(helper)}\nreturn toolSchema`)(z) as (schema: z.ZodType) => z.ZodType
    const schema = z.object({ path: z.object({ petId: z.coerce.bigint() }), body: z.instanceof(Blob).optional() })

    expect(() => schema['~standard'].jsonSchema.input({ target: 'draft-2020-12' })).toThrow('BigInt cannot be represented in JSON Schema')

    const tool = toolSchema(schema)['~standard']

    expect(tool.jsonSchema.input({ target: 'draft-2020-12' })).toMatchObject({
      properties: { path: { properties: { petId: { type: 'integer', format: 'int64' } }, required: ['petId'] }, body: {} },
      required: ['path'],
    })
    expect(tool.validate({ path: { petId: 3 } })).toEqual({ value: { path: { petId: 3n } } })
  })
})

async function renderServer(nodes: Array<ast.OperationNode>, clientOptions: Record<string, unknown> = {}) {
  const plugin = createMockedPlugin<PluginMcp>({ name: 'plugin-mcp', options: defaultOptions, resolver: resolverMcp })
  const driver = createMockedPluginDriver({
    name: 'showPetById',
    plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
  })
  // Register the zod plugin for the schema imports, and plugin-mcp itself for the handler imports, as the driver does.
  const originalGetPlugin = driver.getPlugin.bind(driver)
  driver.getPlugin = ((pluginName: string) => {
    if (pluginName === 'plugin-zod') return mockedZodPlugin
    if (pluginName === 'plugin-mcp') return plugin
    if (pluginName === 'plugin-axios') return { ...mockedTsPlugin, options: { ...mockedTsPlugin.options, ...clientOptions } }
    return originalGetPlugin(pluginName)
  }) as typeof driver.getPlugin

  driver.getResolver = ((pluginName: string) => {
    if (pluginName === 'plugin-zod') return mockedZodPlugin.resolver
    if (pluginName === 'plugin-mcp') return resolverMcp
    return mockedTsPlugin.resolver
  }) as typeof driver.getResolver

  await renderTemplate(serverOperations, nodes, {
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
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [ast.factory.createContent({ contentType: 'text/event-stream', schema: ast.factory.createSchema({ type: 'object' }), stream: {} })],
        }),
      ],
    })
    const source = rawSources((await renderServer([stream])).fileManager.files).join('\n')

    expect(source).not.toContain('streamEvents')
  })

  test('keeps a JSON querystring as its own parameter schema', async () => {
    const source = rawSources((await renderServer([listItems('application/json')])).fileManager.files).join('\n')

    expect(source).toContain('query: z.object({ "filter": listItemsQuerystringFilterSchema })')
  })
})
