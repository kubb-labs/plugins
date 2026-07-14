import type { Adapter, Config } from 'kubb/kit'
import { ast, memoryStorage } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperations } from 'kubb/kit/testing'
import type { PluginEffect } from '@kubb/plugin-effect'
import { resolverEffect } from '@kubb/plugin-effect'
import { describe, expect, test } from 'vitest'
import { rawSources } from '#mocks'
import { resolverEffectHttpApiClient } from '../resolvers/resolverEffectHttpApiClient.ts'
import type { SecurityDocument } from '../security.ts'
import type { PluginEffectHttpApiClient } from '../types.ts'
import { httpApiClientGenerator } from './httpApiClientGenerator.tsx'

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

const defaultOptions: PluginEffectHttpApiClient['resolvedOptions'] = {
  output: { path: 'effectHttpApiClient', barrel: { type: 'named' } },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  baseURL: 'https://example.com',
  mode: 'tag',
}

const mockedEffectPlugin = createMockedPlugin<PluginEffect>({
  name: 'plugin-effect',
  options: { output: { path: 'effect' }, group: null } as PluginEffect['resolvedOptions'],
  resolver: resolverEffect,
})

const securityDocument: SecurityDocument = {
  components: {
    securitySchemes: {
      apiKey: { type: 'apiKey', name: 'x-api-key', in: 'header' },
    },
  },
  paths: {
    '/pets/{pet_id}': {
      get: { security: [{ apiKey: [] }] },
    },
  },
}

const operations: Array<ast.OperationNode> = [
  ast.factory.createOperation({
    operationId: 'getPet',
    method: 'GET',
    path: '/pets/{pet_id}',
    tags: ['pets'],
    parameters: [
      ast.factory.createParameter({ name: 'pet_id', in: 'path', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
      ast.factory.createParameter({
        name: 'fields',
        in: 'query',
        required: false,
        style: 'pipeDelimited',
        explode: false,
        schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] }),
      }),
      ast.factory.createParameter({ name: 'session_id', in: 'cookie', required: false, schema: ast.factory.createSchema({ type: 'string' }) }),
    ],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        description: 'Pet response',
        content: [
          ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }),
          ast.factory.createContent({ contentType: 'application/xml', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }),
          ast.factory.createContent({ contentType: 'application/pdf', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }),
        ],
      }),
    ],
  }),
  ast.factory.createOperation({
    operationId: 'listOrders',
    method: 'GET',
    path: '/orders',
    tags: ['store'],
    responses: [ast.factory.createResponse({ statusCode: '204', description: 'No content' })],
  }),
]

function adapterWithSecurity(): Adapter {
  return { ...createMockedAdapter(), document: securityDocument } as Adapter
}

async function render(options: PluginEffectHttpApiClient['resolvedOptions']): Promise<Array<string>> {
  const plugin = createMockedPlugin<PluginEffectHttpApiClient>({
    name: 'plugin-effect-httpapiclient',
    options,
    resolver: resolverEffectHttpApiClient,
  })
  const driver = createMockedPluginDriver({
    name: options.mode,
    plugin: mockedEffectPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
  })

  await renderGeneratorOperations(httpApiClientGenerator, operations, {
    config: testConfig,
    adapter: adapterWithSecurity(),
    driver,
    plugin,
    options,
    resolver: resolverEffectHttpApiClient,
  })
  return rawSources(driver.fileManager.files)
}

describe('httpApiClientGenerator', () => {
  test('generates grouped native endpoints, content codecs, key remapping, and security', async () => {
    const sources = await render(defaultOptions)
    const output = sources.join('\n')

    expect(output).toContain('HttpApiEndpoint.get("getPet", "/pets/:pet_id"')
    expect(output).toContain('Schema.encodeKeys({ "petId": "pet_id" })')
    expect(output).toContain('Schema.optionalKey(queryParameter(GetPetQueryFields, {"name":"fields","kind":"array","style":"pipeDelimited","explode":false}))')
    expect(output).toContain('headersWithCookies(')
    expect(output).toContain('"cookies": Schema.optionalKey(Schema.Struct')
    expect(output).toContain('export function pathParameter')
    expect(output).toContain('HttpApiSchema.asJson({ contentType: "application/json" })')
    expect(output).toContain('Schema.String.pipe(HttpApiSchema.asText({ contentType: "application/xml" }))')
    expect(output).toContain('Schema.Uint8Array.pipe(HttpApiSchema.asUint8Array({ contentType: "application/pdf" }))')
    expect(output).toContain('HttpApiGroup.make("pets")')
    expect(output).toContain('HttpApiClient.make(Api, { baseUrl: "https://example.com" })')
    expect(output).toContain('"getPet": [[{"name":"apiKey","scopes":[]}]]')
  })

  test('marks groups as top-level in flat mode', async () => {
    const sources = await render({ ...defaultOptions, mode: 'flat' })
    const api = sources.find((source) => source.includes('Root Effect HttpApi contract'))

    expect(api).toContain('HttpApiGroup.make("pets", { topLevel: true })')
    expect(api).toContain('HttpApiGroup.make("store", { topLevel: true })')
  })
})
