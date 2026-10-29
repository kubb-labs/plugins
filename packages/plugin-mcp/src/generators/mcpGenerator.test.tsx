/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */

import type { Config } from '@kubb/kit'
import { ast } from '@kubb/kit'
import { resolverClient } from '@internals/client'
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
    const driver = driverFor(props.name)

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
        expect(source, 'handler forwards the MCP cancellation signal to the client').toContain('signal: ctx.mcpReq.signal')
      }
    }

    await matchFiles(driver.fileManager.files, props.name)
  })
})

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

  // Pinning throwOnError keeps the result shape fixed under a client `throwOnErrorDefault: false`.
  test.each(['data'] as const)('calls the client with throwOnError: true (returnType %s)', async (returnType) => {
    expect(await renderHandler(returnType)).toContain('await getPets({ signal: ctx.mcpReq.signal, throwOnError: true })')
  })

  test("uses the call result as the body when the client returns 'data'", async () => {
    const source = await renderHandler('data')

    expect(source).toContain('text: JSON.stringify(res)')
    expect(source).toContain('structuredContent: { data: res }')
    expect(source).not.toContain('res.data')
  })
})
