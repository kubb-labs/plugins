/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { resolverClient } from '@internals/client'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from 'kubb/kit/testing'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { matchFiles, rawSources } from '#mocks'
import { resolverMcp } from '../resolvers/resolverMcp.ts'
import type { PluginMcp } from '../types.ts'
import { mcpGenerator } from './mcpGenerator.tsx'

const testConfig: Config = {
  root: '.',
  input: '',
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

const mockedAxiosPlugin = createMockedPlugin({
  name: 'plugin-axios',
  options: { output: { path: './clients' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverClient,
})

// The generator looks plugins up by name: plugin-ts for the request types, plugin-axios for the
// contract `<op>`. The built-in mock is name-agnostic, so dispatch on the name here.
function createMultiPluginDriver(name: string) {
  const driver = createMockedPluginDriver({
    name,
    plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
  })
  const byName = { 'plugin-ts': mockedTsPlugin, 'plugin-axios': mockedAxiosPlugin } as Record<string, { resolver?: unknown }>
  return {
    ...driver,
    getPlugin: (pluginName: string) => byName[pluginName] ?? mockedTsPlugin,
    getResolver: (pluginName: string) => byName[pluginName]?.resolver ?? resolverTs,
  } as typeof driver
}

describe('mcpGenerator — Operation', () => {
  const operations = [
    {
      name: 'showPetById',
      node: ast.factory.createOperation({
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
    },
    {
      name: 'getPets',
      node: ast.factory.createOperation({
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
      }),
    },
    {
      name: 'createPet',
      node: ast.factory.createOperation({
        operationId: 'createPets',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: {
          description: 'Pet to add',
          content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
        },
        responses: [
          ast.factory.createResponse({ statusCode: '201', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Null response' }),
        ],
      }),
    },
    {
      name: 'uploadFile',
      node: ast.factory.createOperation({
        operationId: 'uploadFile',
        method: 'POST',
        path: '/pets/{petId}/upload',
        tags: ['pets'],
        parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
        requestBody: {
          description: 'File to upload',
          content: [ast.factory.createContent({ contentType: 'multipart/form-data', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
        },
        responses: [
          ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Uploaded' }),
        ],
      }),
    },
    {
      name: 'deletePet',
      node: ast.factory.createOperation({
        operationId: 'deletePet',
        method: 'DELETE',
        path: '/pets/{petId}',
        tags: ['pets'],
        parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
        responses: [ast.factory.createResponse({ statusCode: '204', description: 'No content', schema: ast.factory.createSchema({ type: 'void' }) })],
      }),
    },
  ] as const satisfies Array<{ name: string; node: ast.OperationNode; options?: Partial<PluginMcp['resolvedOptions']> }>

  test.each(operations)('$name', async (props) => {
    const options: PluginMcp['resolvedOptions'] = {
      ...defaultOptions,
      ...(('options' in props ? (props as { options?: Partial<PluginMcp['resolvedOptions']> }).options : undefined) ?? {}),
    }
    const plugin = createMockedPlugin<PluginMcp>({ name: 'plugin-mcp', options, resolver: resolverMcp })
    const driver = createMultiPluginDriver(props.name)

    await renderGeneratorOperation(mcpGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverMcp,
    })

    for (const source of rawSources(driver.fileManager.files)) {
      if (source.includes('structuredContent')) {
        expect(source, 'handler return is indented at the function-body baseline').toContain('\n  return {\n    content: [')
      }
    }

    await matchFiles(driver.fileManager.files, props.name)
  })
})
