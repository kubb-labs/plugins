/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from '@kubb/kit'
import { ast } from '@kubb/kit'
import { resolverClient } from '@kubb/plugin-client'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import {
  createMockedAdapter,
  createMockedPlugin,
  createMultiPluginDriver,
  matchFiles,
  rawSources,
  renderGeneratorOperation,
  testConfig as baseConfig,
} from '#mocks'
import { resolverMcp } from '../resolvers/resolverMcp.ts'
import type { PluginMcp } from '../types.ts'
import { mcpGenerator } from './mcpGenerator.tsx'

// A string input makes the generated banner carry a `Source:` line, which the snapshots pin.
const testConfig: Config = { ...baseConfig, input: '' }

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

const mockedAxiosPlugin = createMockedPlugin({
  name: 'plugin-axios',
  options: { output: { path: './clients', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverClient,
})

const driverFor = (name: string, clientPlugin: { name?: string; resolver?: unknown } = mockedAxiosPlugin) =>
  createMultiPluginDriver(name, { 'plugin-ts': mockedTsPlugin, [clientPlugin.name ?? 'plugin-axios']: clientPlugin })

describe("mcpGenerator — the client plugin's returnType", () => {
  const node = ast.factory.createOperation({
    operationId: 'getPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Pets' })],
  })

  async function renderHandler(returnType: 'full' | 'data' | undefined) {
    const axiosPlugin = createMockedPlugin({
      name: 'plugin-axios',
      options: { output: { path: './clients', mode: 'directory' }, group: null, returnType } as unknown as PluginTs['resolvedOptions'],
      resolver: resolverClient,
    })
    const driver = driverFor('getPets', axiosPlugin)
    const plugin = createMockedPlugin<PluginMcp>({ name: 'plugin-mcp', options: defaultOptions, resolver: resolverMcp })

    await renderGeneratorOperation(mcpGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverMcp,
    })

    return rawSources(driver.fileManager.files).join('\n')
  }

  test("uses the call result as the body when the client returns 'data'", async () => {
    const source = await renderHandler('data')

    expect(source).toContain('text: JSON.stringify(res)')
    expect(source).toContain('structuredContent: { data: res }')
    expect(source).not.toContain('res.data')
  })
})

describe('mcpGenerator — cookie parameters', () => {
  // The tool takes the cookies as an optional input and passes them to the client call.
  test('getCookies — GET with cookie params', async () => {
    const name = 'getCookies — GET with cookie params'
    const node = ast.factory.createOperation({
      operationId: 'getCookies',
      method: 'GET',
      path: '/cookies',
      tags: ['cookies'],
      parameters: [
        ast.factory.createParameter({ name: 'session', in: 'cookie', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
        ast.factory.createParameter({ name: 'theme', in: 'cookie', schema: ast.factory.createSchema({ type: 'string' }) }),
      ],
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          schema: ast.factory.createSchema({ type: 'object', properties: [] }),
          description: 'The cookies the request sent',
        }),
      ],
    })
    const plugin = createMockedPlugin<PluginMcp>({ name: 'plugin-mcp', options: defaultOptions, resolver: resolverMcp })
    const driver = driverFor(name)

    await renderGeneratorOperation(mcpGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverMcp,
    })

    await matchFiles(driver.fileManager.files, name)
  })
})

describe('mcpGenerator — stream operations', () => {
  // A stream has no single JSON body for the tool output, so no handler is emitted.
  test('emits no handler for text/event-stream', async () => {
    const node = ast.factory.createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [ast.factory.createResponse({ statusCode: '200', mediaType: 'text/event-stream', schema: ast.factory.createSchema({ type: 'object' }) })],
    })
    const plugin = createMockedPlugin<PluginMcp>({ name: 'plugin-mcp', options: defaultOptions, resolver: resolverMcp })
    const driver = driverFor('streamEvents')

    await renderGeneratorOperation(mcpGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverMcp,
    })

    expect(rawSources(driver.fileManager.files)).toStrictEqual([])
  })
})
