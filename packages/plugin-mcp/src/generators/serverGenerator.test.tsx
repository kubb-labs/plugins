import type { Config } from '@kubb/core'
import { ast } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations } from '@kubb/core/mocks'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'
import { resolverZod } from '@kubb/plugin-zod'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverMcp } from '../resolvers/resolverMcp.ts'
import type { PluginMcp } from '../types.ts'
import { serverGenerator } from './serverGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [], parsers: [], adapter: createMockedAdapter() }

const defaultOptions: PluginMcp['resolvedOptions'] = {
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  client: {
    client: 'axios',
    baseURL: '',
    dataReturnType: 'data',
  },
  paramsCasing: undefined,
  group: undefined,
  resolver: resolverMcp,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const mockedZodPlugin = createMockedPlugin<PluginZod>({
  name: 'plugin-zod',
  options: { output: { path: '.' }, group: undefined } as PluginZod['resolvedOptions'],
  resolver: resolverZod,
})

describe('serverGenerator — Operations', () => {
  const nodes: Array<ast.OperationNode> = [
    ast.createOperation({
      operationId: 'showPetById',
      method: 'GET',
      path: '/pets/{petId}',
      tags: ['pets'],
      parameters: [ast.createParameter({ name: 'petId', in: 'path', schema: ast.createSchema({ type: 'string' }), required: true })],
      responses: [ast.createResponse({ statusCode: '200', schema: ast.createSchema({ type: 'object', properties: [] }), description: 'Expected response' })],
    }),
  ]

  test('showPetById', async () => {
    const plugin = createMockedPlugin<PluginMcp>({ name: 'plugin-mcp', options: defaultOptions, resolver: resolverMcp })
    const driver = createMockedPluginDriver({
      name: 'showPetById',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })
    // Also register zod plugin — serverGenerator needs it for zod schema imports
    const originalGetPlugin = driver.getPlugin.bind(driver)
    driver.getPlugin = (pluginName: string) => {
      if (pluginName === 'plugin-zod') return mockedZodPlugin as any
      return originalGetPlugin(pluginName)
    }

    driver.getResolver = (pluginName: string) => {
      if (pluginName === 'plugin-zod') return mockedZodPlugin.resolver as any
      return mockedTsPlugin.resolver as any
    }

    await renderGeneratorOperations(serverGenerator, nodes, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverMcp,
    })

    await matchFiles(driver.fileManager.files, 'showPetById')
  })
})
