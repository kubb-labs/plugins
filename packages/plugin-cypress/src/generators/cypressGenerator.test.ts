/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import { ast } from '@kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation, testConfig } from '#mocks'
import { resolverCypress } from '../resolvers/resolverCypress.ts'
import type { PluginCypress } from '../types.ts'
import { cypressGenerator } from './cypressGenerator.tsx'

const defaultOptions: PluginCypress['resolvedOptions'] = {
  output: { path: '.', mode: 'directory' },
  exclude: [],
  include: undefined,
  override: [],
  baseURL: undefined,
  group: null,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

describe('cypressGenerator — baseURL', () => {
  const node = ast.factory.createOperation({
    operationId: 'getPets',
    method: 'GET',
    path: '/pets',
    tags: ['pets'],
    parameters: [ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'integer' }) })],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        schema: ast.factory.createSchema({ type: 'object', properties: [] }),
        description: 'A paged array of pets',
      }),
    ],
  })

  test('template string — emitted as template literal', async () => {
    const options: PluginCypress['resolvedOptions'] = { ...defaultOptions, baseURL: '${123456}' }
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options, resolver: resolverCypress })
    const driver = createMockedPluginDriver({
      name: 'baseURL template',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverCypress,
    })
    await matchFiles(driver.fileManager.files, 'baseURL template')
  })
})

describe('cypressGenerator — cookie parameters', () => {
  // The request takes the cookies as an optional group and sends `Cookie` only when the call passes cookies. A `style: cookie`
  // value goes out as it is.
  test('getCookies', async () => {
    const node = ast.factory.createOperation({
      operationId: 'getCookies',
      method: 'GET',
      path: '/cookies',
      tags: ['cookies'],
      parameters: [
        ast.factory.createParameter({ name: 'session', in: 'cookie', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
        ast.factory.createParameter({ name: 'sid', in: 'cookie', style: 'cookie', schema: ast.factory.createSchema({ type: 'string' }) }),
        ast.factory.createParameter({ name: 'x-trace', in: 'header', schema: ast.factory.createSchema({ type: 'string' }) }),
      ],
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          schema: ast.factory.createSchema({ type: 'object', properties: [] }),
          description: 'The cookies the request sent',
        }),
      ],
    })
    const plugin = createMockedPlugin<PluginCypress>({ name: 'plugin-cypress', options: defaultOptions, resolver: resolverCypress })
    const driver = createMockedPluginDriver({
      name: 'getCookies',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(cypressGenerator, node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverCypress,
    })

    await matchFiles(driver.fileManager.files, 'getCookies')
  })
})
