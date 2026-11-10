import type { Config, PluginType } from '@kubb/kit'
import { ast, memoryStorage } from '@kubb/kit'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles, renderGeneratorOperation, renderGeneratorOperations } from '#mocks'
import { resolverClient } from '../resolver.ts'
import type { ClientOptions, ClientResolvedOptions, ResolverClient } from '../types.ts'
import { createClientGenerator } from './clientGenerator.tsx'

type PluginFetch = PluginType<'plugin-fetch', ClientOptions, ClientResolvedOptions, ResolverClient>

const clientGenerator = createClientGenerator<PluginFetch>('fetch')

type PluginClient = PluginType<'plugin-client', ClientOptions, ClientResolvedOptions & { importPath: string }, ResolverClient>

// What `@kubb/plugin-client` registers: a user-owned client module, imported exactly as configured.
const customClientGenerator = createClientGenerator<PluginClient>('client')

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

const defaultOptions: PluginFetch['resolvedOptions'] = {
  output: { path: '.', mode: 'directory', banner: '/* eslint-disable no-alert, no-console */' },
  exclude: [],
  include: undefined,
  override: [],
  group: null,
  baseURL: undefined,
  throwOnErrorDefault: true,
  validator: false,
  returnType: 'full',
  sdk: undefined,
  resolver: resolverClient,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.', mode: 'directory' }, group: null } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const findPetsByTagsNode = ast.factory.createOperation({
  operationId: 'findPetsByTags',
  method: 'GET',
  path: '/pet/findByTags',
  tags: ['pet'],
  parameters: [
    ast.factory.createParameter({
      name: 'tags',
      in: 'query',
      schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] }),
      required: true,
    }),
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const getPetByIdNode = ast.factory.createOperation({
  operationId: 'getPetById',
  method: 'GET',
  path: '/pet/{petId}',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'integer' }), required: true })],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const createPetNode = ast.factory.createOperation({
  operationId: 'addPet',
  method: 'POST',
  path: '/pet',
  tags: ['pet'],
  requestBody: {
    required: true,
    content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  },
  responses: [
    ast.factory.createResponse({ statusCode: '201', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Pet created' }),
    ast.factory.createResponse({ statusCode: '405', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'Invalid input' }),
  ],
})

const uploadFileNode = ast.factory.createOperation({
  operationId: 'uploadFile',
  method: 'POST',
  path: '/pet/{petId}/uploadImage',
  tags: ['pet'],
  parameters: [ast.factory.createParameter({ name: 'petId', in: 'path', schema: ast.factory.createSchema({ type: 'integer' }), required: true })],
  requestBody: {
    required: true,
    content: [
      ast.factory.createContent({
        contentType: 'multipart/form-data',
        schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      }),
    ],
  },
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const listPetsStyledNode = ast.factory.createOperation({
  operationId: 'listPetsStyled',
  method: 'GET',
  path: '/pets/{petId}',
  tags: ['pet'],
  parameters: [
    ast.factory.createParameter({
      name: 'petId',
      in: 'path',
      schema: ast.factory.createSchema({ type: 'integer' }),
      required: true,
      style: 'matrix',
      explode: true,
    }),
    ast.factory.createParameter({
      name: 'tags',
      in: 'query',
      schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] }),
      required: false,
      style: 'pipeDelimited',
      explode: false,
    }),
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const getCookiesNode = ast.factory.createOperation({
  operationId: 'getCookies',
  method: 'GET',
  path: '/cookies',
  tags: ['cookie'],
  parameters: [
    ast.factory.createParameter({ name: 'session', in: 'cookie', schema: ast.factory.createSchema({ type: 'string' }), required: true }),
    ast.factory.createParameter({ name: 'theme', in: 'cookie', schema: ast.factory.createSchema({ type: 'string' }), explode: false }),
  ],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'successful operation',
    }),
  ],
})

const streamEventsNode = ast.factory.createOperation({
  operationId: 'streamEvents',
  method: 'GET',
  path: '/events',
  tags: ['events'],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      mediaType: 'text/event-stream',
      schema: ast.factory.createSchema({ type: 'object', properties: [] }),
      description: 'event stream',
    }),
  ],
})

const streamChatMember = (name: string) =>
  ast.factory.createSchema({
    type: 'object',
    properties: [
      ast.factory.createProperty({ name: 'event', required: true, schema: ast.factory.createSchema({ type: 'enum', enumValues: [name] }) }),
      ast.factory.createProperty({ name: 'data', schema: ast.factory.createSchema({ type: 'string' }) }),
    ],
  })
const streamChatSchema = ast.factory.createSchema({
  type: 'union',
  discriminatorPropertyName: 'event',
  members: [streamChatMember('message_delta'), streamChatMember('ping')],
})

// An OpenAPI 3.2 `itemSchema` event union, as the adapter emits it: `stream.schema` is the item and `shape` says each item is a whole event.
const streamChatNode = ast.factory.createOperation({
  operationId: 'streamChat',
  method: 'POST',
  path: '/chat',
  tags: ['chat'],
  responses: [
    ast.factory.createResponse({
      statusCode: '200',
      description: 'typed events',
      content: [
        ast.factory.createContent({ contentType: 'text/event-stream', schema: streamChatSchema, stream: { schema: streamChatSchema, shape: 'event' } }),
      ],
    }),
  ],
})

const securityMeta: ast.InputMeta = {
  auth: [
    { name: 'bearerAuth', credential: { type: 'http', scheme: 'bearer' } },
    { name: 'petstore_auth', credential: { type: 'oauth2', flows: {} } },
    { name: 'api_key', credential: { type: 'apiKey', name: 'api_key', in: 'header' } },
  ],
}

describe('clientGenerator operation', () => {
  const testData = [
    { name: 'addPetMultiStatus', node: createPetNode, options: {} },
    // multipart/form-data request body bakes a `contentType` into the call config.
    { name: 'uploadFileMultipart', node: uploadFileNode, options: {} },
    // Parameter style/explode flows from the ParameterNode into a `styles` call-config entry.
    { name: 'listPetsWithStyles', node: listPetsStyledNode, options: {} },
    // Cookie parameters reach the call through the `cookies` group, with their explode in `styles`.
    { name: 'getCookiesWithCookieParams', node: getCookiesNode, options: {} },
    // text/event-stream response returns a typed event stream instead of a one-shot result.
    { name: 'streamEventsSse', node: streamEventsNode, options: {} },
    // A `stream.shape` of `event` types each event by name.
    { name: 'streamChatTypedEvents', node: streamChatNode, options: {} },
    // An operation's own oauth2 requirement with its scopes.
    {
      name: 'addPetWithSecurity',
      node: { ...createPetNode, auth: [[{ scheme: 'petstore_auth', scopes: ['write:pets', 'read:pets'] }]] },
      options: {},
      meta: securityMeta,
    },
    // The document's global `bearerAuth`, which the adapter copies onto an operation without its own `security`.
    { name: 'findPetsByTagsWithGlobalSecurity', node: { ...findPetsByTagsNode, auth: [[{ scheme: 'bearerAuth' }]] }, options: {}, meta: securityMeta },
    // Two requirements referencing two different schemes (oauth2 bearer + apiKey header).
    {
      name: 'getPetByIdWithMultipleSchemes',
      node: { ...getPetByIdNode, auth: [[{ scheme: 'petstore_auth', scopes: ['read:pets'] }], [{ scheme: 'api_key' }]] },
      options: {},
      meta: securityMeta,
    },
    // A path-level `servers` entry becomes the call's default `baseURL`, before `...config` so a per-call one still wins.
    {
      name: 'streamEventsWithPathServer',
      node: { ...streamEventsNode, servers: [{ url: 'https://echo.websocket.org' }] },
      options: {},
    },
  ] as const satisfies Array<{
    name: string
    node: ast.OperationNode
    options: Partial<PluginFetch['resolvedOptions']>
    meta?: ast.InputMeta
  }>

  test.each(testData)('$name', async (props) => {
    const options: PluginFetch['resolvedOptions'] = { ...defaultOptions, ...props.options }
    const plugin = createMockedPlugin<PluginFetch>({ name: 'plugin-fetch', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: props.name,
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(clientGenerator, props.node, {
      config: testConfig,
      adapter: createMockedAdapter(),
      meta: 'meta' in props ? props.meta : undefined,
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    await matchFiles(driver.fileManager.files, props.name)
  })
})

describe('clientGenerator with a custom client module', () => {
  test('getPetByIdPlainCustomClientPath', async () => {
    const options: PluginClient['resolvedOptions'] = { ...defaultOptions, returnType: 'plain', importPath: '@acme/api-client' }
    const plugin = createMockedPlugin<PluginClient>({ name: 'plugin-client', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: 'getPetByIdPlainCustomClientPath',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperation(customClientGenerator, getPetByIdNode, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    await matchFiles(driver.fileManager.files, 'getPetByIdPlainCustomClientPath')
  })
})

describe('clientGenerator without an operation type source', () => {
  test('throws KUBB_MISSING_DEPENDENCY when neither plugin-ts nor an inferred plugin-zod is registered', async () => {
    const plugin = createMockedPlugin<PluginFetch>({ name: 'plugin-fetch', options: defaultOptions, resolver: resolverClient })

    await expect(
      renderGeneratorOperation(clientGenerator, getPetByIdNode, {
        config: testConfig,
        adapter: createMockedAdapter(),
        driver: createMockedPluginDriver({ name: 'missingOperationTypes' }),
        plugin,
        options: defaultOptions,
        resolver: resolverClient,
      }),
    ).rejects.toMatchObject({
      diagnostic: {
        code: 'KUBB_MISSING_DEPENDENCY',
        message: 'Plugin "plugin-fetch" has no source for operation types.',
        help: 'Add `pluginTs()` before "plugin-fetch", or add `pluginZod({ inferred: true })`.',
      },
    })
  })
})

describe('clientGenerator runtime files', () => {
  const sseGenerator = createClientGenerator<PluginFetch>('fetch', { sse: '/templates/sse.ts' })

  test.each([
    {
      name: 'copies sse.ts and re-exports it from client.ts when an operation streams events',
      nodes: [getPetByIdNode, streamEventsNode],
      baseURL: undefined,
      expected: true,
    },
    { name: 'keeps the baseURL line next to the re-export', nodes: [streamEventsNode], baseURL: 'https://api.test', expected: true },
    { name: 'skips sse.ts when no operation streams events', nodes: [getPetByIdNode, createPetNode], baseURL: undefined, expected: false },
  ])('$name', async ({ nodes, baseURL, expected }) => {
    const options = { ...defaultOptions, baseURL }
    const plugin = createMockedPlugin<PluginFetch>({ name: 'plugin-fetch', options, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: 'runtime',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperations(sseGenerator, nodes, {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options,
      resolver: resolverClient,
    })

    const runtime = driver.fileManager.files.filter((file) => file.path.includes('.kubb/'))
    if (!expected) return expect(runtime).toStrictEqual([])
    expect(runtime.map((file) => [file.path.split('/').slice(-2).join('/'), file.copy, file.footer]).sort()).toStrictEqual([
      [
        '.kubb/client.ts',
        undefined,
        [
          "import { streamMediaTypes } from './sse.ts'",
          `client.setConfig({ ${baseURL ? `baseURL: "${baseURL}", ` : ''}mediaTypes: { ...streamMediaTypes } })`,
          "export * from './sse.ts'",
        ].join('\n'),
      ],
      ['.kubb/sse.ts', '/templates/sse.ts', undefined],
    ])
  })

  test('registers the form media types only when an operation sends a form body', async () => {
    const plugin = createMockedPlugin<PluginFetch>({ name: 'plugin-fetch', options: defaultOptions, resolver: resolverClient })
    const driver = createMockedPluginDriver({
      name: 'runtime',
      plugin: mockedTsPlugin as unknown as NonNullable<Parameters<typeof createMockedPluginDriver>[0]>['plugin'],
    })

    await renderGeneratorOperations(sseGenerator, [getPetByIdNode, uploadFileNode], {
      config: testConfig,
      adapter: createMockedAdapter(),
      driver,
      plugin,
      options: defaultOptions,
      resolver: resolverClient,
    })

    const runtime = driver.fileManager.files.filter((file) => file.path.includes('.kubb/'))
    expect(runtime.map((file) => [file.path.split('/').slice(-2).join('/'), file.footer])).toStrictEqual([
      ['.kubb/client.ts', "import { formMediaTypes } from './mediaTypes.ts'\nclient.setConfig({ mediaTypes: { ...formMediaTypes } })"],
    ])
  })
})
