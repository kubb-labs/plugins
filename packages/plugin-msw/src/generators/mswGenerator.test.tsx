/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import fs from 'node:fs/promises'
import path from 'node:path'
import { ast } from 'kubb/kit'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, renderGeneratorOperation } from 'kubb/kit/testing'
import type { PluginFaker } from '@kubb/plugin-faker'
import { pluginFakerName, resolverFaker } from '@kubb/plugin-faker'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import * as msw from 'msw'
import { describe, expect, onTestFinished, test } from 'vitest'
import { matchFiles, rawSources, testConfig } from '#mocks'
import { resolverMsw } from '../resolvers/resolverMsw.ts'
import type { PluginMsw } from '../types.ts'
import { mswGenerator } from './mswGenerator.tsx'

const defaultOptions: PluginMsw['resolvedOptions'] = {
  output: { path: '.', mode: 'directory' },
  parser: 'data',
  baseURL: undefined,
  group: null,
  exclude: [],
  include: undefined,
  override: [],
  handlers: false,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const mockedFakerPlugin = createMockedPlugin<PluginFaker>({
  name: pluginFakerName,
  options: { output: { path: '.', mode: 'directory' }, group: null } as PluginFaker['resolvedOptions'],
  resolver: resolverFaker,
})

const searchPetsNode = ast.factory.createOperation({
  operationId: 'searchPets',
  method: 'QUERY',
  path: '/pets/search',
  tags: ['pets'],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      description: 'Matching pets',
      schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'object', properties: [] })] }),
    }),
  ],
})

const listPetsNode = ast.factory.createOperation({
  operationId: 'listPets',
  method: 'GET',
  path: '/pets',
  tags: ['pets'],
  parameters: [ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'string' }) })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      description: 'A paged array of pets',
      schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'object', properties: [] })] }),
    }),
    ast.factory.createResponse({ statusCode: '400', description: 'Invalid', schema: ast.factory.createSchema({ type: 'void' }) }),
    ast.factory.createResponse({
      statusCode: 'default',
      description: 'unexpected error',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
    }),
  ],
})

const showPetByIdNode = ast.factory.createOperation({
  operationId: 'showPetById',
  method: 'GET',
  path: '/pets/{petId}',
  tags: ['pets'],
  parameters: [
    ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ast.factory.createParameter({ name: 'testId', in: 'path', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      description: 'Expected response to a valid request',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
    }),
    ast.factory.createResponse({
      statusCode: 'default',
      description: 'unexpected error',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
    }),
  ],
})

const createPetsNode = ast.factory.createOperation({
  operationId: 'createPets',
  method: 'POST',
  path: '/pets',
  tags: ['pets'],
  requestBody: {
    required: true,
    content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  },
  responses: [
    ast.factory.createResponse({ statusCode: '201', description: 'Bodyless response', schema: ast.factory.createSchema({ type: 'unknown' }) }),
    ast.factory.createResponse({
      statusCode: 'default',
      description: 'unexpected error',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
    }),
  ],
})

const responseNameCollisionNode = ast.factory.createOperation({
  operationId: 'getThing',
  method: 'GET',
  path: '/thing',
  tags: ['things'],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      description: 'OK',
      schema: ast.factory.createSchema({ type: 'ref', name: 'GetThingResponse', ref: '#/components/schemas/GetThingResponse' }),
    }),
  ],
})

const enumResponseNameCollisionNode = ast.factory.createOperation({
  operationId: 'getThing',
  method: 'GET',
  path: '/thing',
  tags: ['things'],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      description: 'OK',
      schema: ast.factory.createSchema({ type: 'ref', name: 'GetThing', ref: '#/components/schemas/GetThing' }),
    }),
  ],
})

type RenderProps = {
  name: string
  node: ast.OperationNode
  options: Partial<PluginMsw['resolvedOptions']>
  tsEnum?: PluginTs['resolvedOptions']['enum']
  enumNames?: Array<string>
}

async function renderOperation(props: RenderProps) {
  const options: PluginMsw['resolvedOptions'] = {
    ...defaultOptions,
    ...props.options,
  }
  const plugin = createMockedPlugin<PluginMsw>({ name: 'plugin-msw', options, resolver: resolverMsw })
  const driver = createMockedPluginDriver({ name: props.name })
  const tsPlugin = props.tsEnum
    ? createMockedPlugin<PluginTs>({
        name: 'plugin-ts',
        options: { output: { path: '.', mode: 'directory' }, group: null, enum: props.tsEnum } as PluginTs['resolvedOptions'],
        resolver: resolverTs,
      })
    : mockedTsPlugin

  driver.getPlugin = ((pluginName: string) => {
    if (pluginName === 'plugin-ts') return tsPlugin
    if (pluginName === pluginFakerName) return mockedFakerPlugin
    return undefined
  }) as typeof driver.getPlugin

  driver.getResolver = ((pluginName: string) => {
    if (pluginName === 'plugin-ts') return tsPlugin.resolver
    if (pluginName === pluginFakerName) return mockedFakerPlugin.resolver
    return undefined
  }) as typeof driver.getResolver

  await renderGeneratorOperation(mswGenerator, props.node, {
    config: testConfig,
    adapter: createMockedAdapter(),
    driver,
    plugin,
    options,
    resolver: resolverMsw,
    meta: { enumNames: props.enumNames ?? [], circularNames: [] },
  })

  return driver.fileManager.files
}

describe('mswGenerator operation', () => {
  const testData: Array<RenderProps> = [
    { name: 'showPetById', node: showPetByIdNode, options: {} },
    { name: 'getPets', node: listPetsNode, options: {} },
    { name: 'getPetsFaker', node: listPetsNode, options: { parser: 'faker' as const } },
    { name: 'getPetsBaseUrl', node: listPetsNode, options: { baseURL: 'https://petstore.swagger.io/v1' } },
    { name: 'getPetsFakerTemplateBaseUrl', node: listPetsNode, options: { parser: 'faker' as const, baseURL: '${process.env.API_URL}' } },
    { name: 'createPet', node: createPetsNode, options: {} },
    { name: 'createPetFaker', node: createPetsNode, options: { parser: 'faker' as const } },
    { name: 'searchPets', node: searchPetsNode, options: {} },
    { name: 'responseNameCollision', node: responseNameCollisionNode, options: {} },
    {
      name: 'enumResponseNameCollision',
      node: enumResponseNameCollisionNode,
      options: {},
      tsEnum: { type: 'asConst', constCasing: 'camelCase', typeSuffix: 'Response', keyCasing: 'none' },
      enumNames: ['GetThing'],
    },
    {
      name: 'enumResponseNameNoCollision',
      node: responseNameCollisionNode,
      options: {},
      tsEnum: { type: 'asConst', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' },
      enumNames: ['GetThingResponse'],
    },
  ]

  test.each(testData)('$name', async (props) => {
    const files = await renderOperation(props)

    await matchFiles(files, props.name)
  })
})

async function importGenerated(source: string, stubs: Record<string, string> = {}): Promise<Record<string, any>> {
  const dir = await fs.mkdtemp(path.join(import.meta.dirname, '.msw-'))
  onTestFinished(() => fs.rm(dir, { recursive: true, force: true }))
  for (const [name, code] of Object.entries(stubs)) await fs.writeFile(path.join(dir, `${name}.ts`), code)
  await fs.writeFile(path.join(dir, 'handler.ts'), source)

  return import(path.join(dir, 'handler.ts'))
}

describe('mswGenerator QUERY handler', () => {
  // MSW has no `http.query`, so the handler is registered with `http.all` and answers QUERY only.
  async function getResponse(method: string) {
    const files = await renderOperation({ name: 'searchPets', node: searchPetsNode, options: {} })
    const [source] = rawSources(files)
    const handlers = await importGenerated(source!)

    return msw.getResponse([handlers.searchPetsHandler([{ id: 1 }])], new Request('http://localhost/pets/search', { method, body: '{}' }), {
      baseUrl: 'http://localhost',
    })
  }

  test('answers a QUERY request', async () => {
    const response = await getResponse('QUERY')

    expect(await response?.json()).toEqual([{ id: 1 }])
  })

  test('lets other methods on the same path pass through', async () => {
    expect(await getResponse('POST')).toBeUndefined()
  })
})

describe('mswGenerator faker fallback', () => {
  const fakerData = [{ id: 1, name: 'faker' }]

  // Runs the generated handler with MSW, with a stub standing in for the `@kubb/plugin-faker` output.
  async function getResponseBody(data: unknown) {
    const files = await renderOperation({ name: 'getPetsFaker', node: listPetsNode, options: { parser: 'faker' } })
    const [source] = rawSources(files)
    const handlers = await importGenerated(source!, { createListPets: `export const createListPetsResponse = () => (${JSON.stringify(fakerData)})` })

    const response = await msw.getResponse([handlers.listPetsHandler(data)], new Request('http://localhost/pets'), { baseUrl: 'http://localhost' })

    return response?.json()
  }

  test.each([0])('returns the falsy payload %j instead of Faker data', async (data) => {
    expect(await getResponseBody(data)).toBe(data)
  })

  test.each([null])('falls back to Faker data when data is %s', async (data) => {
    expect(await getResponseBody(data)).toEqual(fakerData)
  })
})
