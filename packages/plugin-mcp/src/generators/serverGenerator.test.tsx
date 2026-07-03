import type { Config } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations } from 'kubb/kit/testing'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'
import { resolverZod } from '@kubb/plugin-zod'
import { describe, test } from 'vitest'
import { matchFiles } from '#mocks'
import { resolverMcp } from '../resolvers/resolverMcp.ts'
import type { PluginMcp } from '../types.ts'
import { serverGenerator } from './serverGenerator.tsx'

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

const defaultOptions: PluginMcp['resolvedOptions'] = {
  output: { path: '.' },
  exclude: [],
  include: undefined,
  override: [],
  client: { kind: 'contract', pluginName: 'plugin-axios' },
  group: null,
  resolver: resolverMcp,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const mockedZodPlugin = createMockedPlugin<PluginZod>({
  name: 'plugin-zod',
  options: { output: { path: '.' }, group: null } as PluginZod['resolvedOptions'],
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
  ]

  test('showPetById', async () => {
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

    await matchFiles(driver.fileManager.files, 'showPetById')
  })
})
