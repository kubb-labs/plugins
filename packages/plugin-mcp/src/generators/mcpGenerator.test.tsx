/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from '@kubb/kit'
import { ast } from '@kubb/kit'
import { resolverClient } from '@internals/client'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMultiPluginDriver, rawSources, renderGeneratorOperation, testConfig as baseConfig } from '#mocks'
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
