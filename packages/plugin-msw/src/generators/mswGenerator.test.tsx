/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { promisify } from 'node:util'
import { ast } from '@kubb/kit'
import type { PluginFaker } from '@kubb/plugin-faker'
import { pluginFakerName, resolverFaker } from '@kubb/plugin-faker'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import * as msw from 'msw'
import { describe, expect, onTestFinished, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, rawSources, renderGeneratorOperation, testConfig } from '#mocks'
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
  driver.inputNode = ast.factory.createInput({
    schemas: (props.enumNames ?? []).map((name) => ast.factory.createSchema({ type: 'enum', name, enumValues: [] })),
  })
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
  })

  return driver.fileManager.files
}

describe('mswGenerator operation', () => {
  const testData: Array<RenderProps> = [
    { name: 'showPetById', node: showPetByIdNode, options: {} },
    { name: 'getPets', node: listPetsNode, options: {} },
    { name: 'getPetsFaker', node: listPetsNode, options: { parser: 'faker' as const } },
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

describe('mswGenerator request body types', () => {
  test.each(['unknown', '{ name: string }'])('typechecks a handler when the request body is %s', async (bodyType) => {
    const files = await renderOperation({ name: 'createPet', node: createPetsNode, options: {} })
    const [source] = rawSources(files)
    const dir = await fs.mkdtemp(path.join(import.meta.dirname, '.msw-'))
    onTestFinished(() => fs.rm(dir, { recursive: true, force: true }))
    await fs.writeFile(path.join(dir, 'handler.ts'), source!)
    await fs.writeFile(
      path.join(dir, 'CreatePets.ts'),
      `export type CreatePetsBody = ${bodyType}
export type CreatePetsResponse = unknown`,
    )
    await fs.writeFile(
      path.join(dir, 'check.ts'),
      `import { createPetsHandler } from './handler'
import { HttpResponse } from 'msw/http'
createPetsHandler(async ({ request }) => {
  const body: ${bodyType} = await request.json()
  return new HttpResponse(JSON.stringify(body))
})`,
    )
    const compiler = path.join(path.dirname(createRequire(import.meta.url).resolve('typescript/package.json')), 'bin/tsc')

    await expect(
      promisify(execFile)(process.execPath, [
        compiler,
        '--ignoreConfig',
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--module',
        'preserve',
        '--moduleResolution',
        'bundler',
        '--target',
        'es2022',
        path.join(dir, 'check.ts'),
      ]),
    ).resolves.toMatchObject({ stdout: '', stderr: '' })
  })
})

describe.each([
  ['QUERY', searchPetsNode],
  ['SUBSCRIBE', { ...searchPetsNode, operationId: 'subscribePets', method: 'SUBSCRIBE' }],
] as const)('mswGenerator %s handler', (operationMethod, node) => {
  // MSW has no `http.query` and no helper for a custom `additionalOperations` method, so the handler is registered with
  // `http.all` and answers its own method only.
  async function getResponse(method: string) {
    const files = await renderOperation({ name: node.operationId, node, options: {} })
    const [source] = rawSources(files)
    const handlers = await importGenerated(source!)

    return msw.getResponse([handlers[`${node.operationId}Handler`]([{ id: 1 }])], new Request('http://localhost/pets/search', { method, body: '{}' }), {
      baseUrl: 'http://localhost',
    })
  }

  test('answers a request with its method', async () => {
    const response = await getResponse(operationMethod)

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

describe('mswGenerator body encoding', () => {
  const operation = (operationId: string, contentType: string) =>
    ast.factory.createOperation({
      operationId,
      method: 'GET',
      // A path of its own: the resolver names a handler by its method and path.
      path: `/${operationId}`,
      tags: ['pets'],
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          description: 'A pet',
          content: [ast.factory.createContent({ contentType, schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
        }),
      ],
    })

  async function getBody(node: ast.OperationNode, data: unknown) {
    const files = await renderOperation({ name: node.operationId, node, options: {} })
    const handlers = await importGenerated(rawSources(files)[0]!)
    const response = await msw.getResponse([handlers[`${node.operationId}Handler`](data)], new Request(`http://localhost/${node.operationId}`), {
      baseUrl: 'http://localhost',
    })

    return response?.text()
  }

  test('sends an int64 mock, a bigint, as a JSON number', async () => {
    expect(await getBody(operation('getBigPet', 'application/json'), { id: 9n })).toBe('{"id":9}')
  })

  test('frames an event-stream mock as one data event, and sends nothing without data', async () => {
    expect(await getBody(operation('streamPet', 'text/event-stream'), { id: 1 })).toBe('data: {"id":1}\n\n')
    // A string goes out unquoted, one `data:` line per line, since the client keeps string data as text.
    expect(await getBody(operation('streamText', 'text/event-stream'), 'a\nb')).toBe('data: a\ndata: b\n\n')
    expect(await getBody(operation('streamNoPet', 'text/event-stream'), undefined)).toBe('')
  })

  const eventOperation = (operationId: string, examples?: Array<ast.ExampleNode>) =>
    ast.factory.createOperation({
      operationId,
      method: 'GET',
      path: `/${operationId}`,
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({
              contentType: 'text/event-stream',
              schema: ast.factory.createSchema({ type: 'object', properties: [] }),
              stream: { shape: 'event' },
              examples,
            }),
          ],
        }),
      ],
    })

  test('writes an event-shaped item as its event, id, retry, and data lines', async () => {
    const node = eventOperation('streamEvent')

    expect(await getBody(node, { event: 'ping', id: '7', retry: 1000, data: { id: 1 } })).toBe('event: ping\nid: 7\nretry: 1000\ndata: {"id":1}\n\n')
    expect(await getBody(eventOperation('streamTextEvent'), { event: 'ping', data: 'a\nb' })).toBe('event: ping\ndata: a\ndata: b\n\n')
  })

  test('sends a serialized SSE example as it is when there is no body', async () => {
    const node = eventOperation('streamExample', [{ serializedValue: 'event: ping\ndata: hi\n\n' }])

    expect(await getBody(node, undefined)).toBe('event: ping\ndata: hi\n\n')
  })
})

describe('mswGenerator text response', () => {
  const getPetNode = ast.factory.createOperation({
    operationId: 'getPet',
    method: 'GET',
    path: '/pet',
    tags: ['pets'],
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        description: 'A pet',
        content: ['application/json', 'application/xml'].map((contentType) =>
          ast.factory.createContent({ contentType, schema: ast.factory.createSchema({ type: 'object', properties: [] }) }),
        ),
      }),
    ],
  })

  async function getResponse(data: unknown) {
    const files = await renderOperation({ name: 'getPet', node: getPetNode, options: {} })
    const [source] = rawSources(files)
    const handlers = await importGenerated(source!)

    return msw.getResponse([handlers.getPetHandler(data)], new Request('http://localhost/pet'), { baseUrl: 'http://localhost' })
  }

  test('sends a string body as raw XML', async () => {
    const response = await getResponse('<pet/>')

    expect(response?.headers.get('Content-Type')).toBe('application/xml')
    expect(await response?.text()).toBe('<pet/>')
  })

  test('sends an object body as JSON', async () => {
    const response = await getResponse({ id: 1 })

    expect(response?.headers.get('Content-Type')).toBe('application/json')
    expect(await response?.json()).toEqual({ id: 1 })
  })
})

describe('mswGenerator ranged statuses', () => {
  // A range such as `4xx` gets its own helper, which answers with the first code of its class.
  test('generates a helper per range that responds with its first code', async () => {
    const node = ast.factory.createOperation({
      operationId: 'getRanged',
      method: 'GET',
      path: '/ranged',
      responses: (['2xx', '4xx'] as const).map((statusCode) =>
        ast.factory.createResponse({ statusCode, schema: ast.factory.createSchema({ type: 'object', properties: [] }) }),
      ),
    })
    const files = await renderOperation({ name: 'getRanged', node, options: {} })
    const handlers = await importGenerated(rawSources(files)[0]!)

    expect(handlers.getRangedHandlerResponse4xx({ id: 1 }).status).toBe(400)
    expect(handlers.getRangedHandlerResponse2xx({ id: 1 }).status).toBe(200)
  })
})
