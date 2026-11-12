import { ast, casing, createResolver } from '@kubb/kit'
import type { Group, Memo, Output, PluginType, Resolver } from '@kubb/kit'
import { describe, expect, test, vi } from 'vitest'
import {
  buildOperationComments,
  buildOptionsSchema,
  buildRequestConfigType,
  getContentTypeInfo,
  hasRequestContentTypeChoice,
  getEventStream,
  getStreamFraming,
  hasTextEventData,
  getRequestGroupOptionality,
  hasEventStreamContent,
  hasStreamVariant,
  isEventStream,
  resolveErrorNames,
  resolveOperationFile,
  resolveOperationTypeNames,
  resolveResponseTypes,
  resolveStatusCodeNames,
  resolveSuccessNames,
  toResponseContent,
  type OperationTypeNameResolver,
  type RequestConfigResolver,
  type ResponseNameResolver,
  type ResponseStatusNameResolver,
} from './operation.ts'
import { createCasedFile } from './resolver.ts'

type TestPlugin = PluginType<
  'test',
  object,
  object,
  Resolver & RequestConfigResolver & ResponseNameResolver & ResponseStatusNameResolver & OperationTypeNameResolver
>

const resolver = createResolver<TestPlugin>({
  pluginName: 'test',
  param: {
    path(_node, param) {
      return `${param.name}PathParams`
    },
    query(_node, param) {
      return `${param.name}QueryParams`
    },
    headers(_node, param) {
      return `${param.name}HeaderParams`
    },
    cookies(_node, param) {
      return `${param.name}CookieParams`
    },
  },
  response: {
    body(node) {
      return `${node.operationId}Data`
    },
    response(node) {
      return `${node.operationId}Response`
    },
    status(_node, statusCode) {
      return `Status${statusCode}`
    },
  },
})

describe('getContentTypeInfo', () => {
  test('returns defaults for operations without a request body', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(getContentTypeInfo(node)).toStrictEqual({
      contentTypes: [],
      isMultipleContentTypes: false,
      contentTypeUnion: '',
      defaultContentType: 'application/json',
      hasFormData: false,
    })
  })

  test('detects multiple content types and form data', () => {
    const node = ast.factory.createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      requestBody: {
        content: [
          ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
          ast.factory.createContent({ contentType: 'multipart/form-data', schema: ast.factory.createSchema({ type: 'object' }) }),
        ],
      },
    })

    expect(getContentTypeInfo(node)).toStrictEqual({
      contentTypes: ['application/json', 'multipart/form-data'],
      isMultipleContentTypes: true,
      contentTypeUnion: '"application/json" | "multipart/form-data"',
      defaultContentType: 'application/json',
      hasFormData: true,
    })
  })
})

describe('buildOptionsSchema with several request content types', () => {
  const node = ast.factory.createOperation({
    operationId: 'patchF',
    method: 'PATCH',
    path: '/f',
    requestBody: {
      content: [
        ast.factory.createContent({ contentType: 'multipart/form-data', schema: ast.factory.createSchema({ type: 'object' }) }),
        ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
      ],
    },
  })

  test('pairs each body variant with its media type when asked to', () => {
    const schema = buildOptionsSchema(node, resolver, { pairContentTypes: true })
    if (schema.type !== 'union') throw new Error('expected a union')

    const contentTypes = (schema.members ?? []).map((member) => {
      const props = ast.schema.narrow(member, 'object')?.properties ?? []
      return { required: props.find((p) => p.name === 'contentType')?.required, body: props.find((p) => p.name === 'body')?.schema.type }
    })

    expect(contentTypes).toStrictEqual([
      { required: false, body: 'ref' },
      { required: true, body: 'ref' },
    ])
    expect(hasRequestContentTypeChoice(node)).toBe(true)
  })

  test('keeps the plain object without the flag', () => {
    expect(buildOptionsSchema(node, resolver).type).toBe('object')
  })
})

describe('buildRequestConfigType', () => {
  test('leaves contentType to the mutation variables when the request body has multiple', () => {
    const node = ast.factory.createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      requestBody: {
        content: [
          ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
          ast.factory.createContent({ contentType: 'application/xml', schema: ast.factory.createSchema({ type: 'object' }) }),
        ],
      },
    })

    expect(buildRequestConfigType(node)).toBe(
      `Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'contentType' | 'throwOnError'>>`,
    )
  })

  test('offers a response content type when the success response has multiple', () => {
    const node = ast.factory.createOperation({
      operationId: 'getPet',
      method: 'GET',
      path: '/pets/{petId}',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
            ast.factory.createContent({ contentType: 'application/xml', schema: ast.factory.createSchema({ type: 'object' }) }),
          ],
        }),
      ],
    })

    expect(buildRequestConfigType(node)).toBe(
      `Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>> & { contentType?: { response?: "application/json" | "application/xml" } }`,
    )
  })

  test('omits every request group when no request schema exists', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(buildRequestConfigType(node)).toBe(`Partial<Omit<RequestConfig, 'path' | 'query' | 'body' | 'headers' | 'cookies' | 'url' | 'throwOnError'>>`)
  })
})

describe('buildOperationComments', () => {
  test('leads with the request line as plain text', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{petId}',
      description: 'Show pet',
      summary: 'Show',
      deprecated: true,
    })

    expect(buildOperationComments(node)).toStrictEqual(['`GET /pets/{petId}`', '@description Show pet', '@summary Show', '@deprecated'])
  })

  test('links the external docs with @see', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets',
      externalDocs: { url: 'https://example.com/pets', description: 'Pet guide' },
    })

    expect(buildOperationComments(node)).toStrictEqual(['`GET /pets`', '@see https://example.com/pets Pet guide'])
  })

  test('splits multiline text into trimmed lines', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{pet-id}',
      description: 'Show pet\n  details',
      deprecated: true,
    })

    expect(buildOperationComments(node, { splitLines: true })).toStrictEqual(['`GET /pets/{pet-id}`', '@description Show pet', 'details', '@deprecated'])
  })
})

describe('response status helpers', () => {
  const node = ast.factory.createOperation({
    operationId: 'createPet',
    method: 'POST',
    path: '/pets',
    responses: [
      ast.factory.createResponse({ statusCode: '201', schema: ast.factory.createSchema({ type: 'object' }) }),
      ast.factory.createResponse({ statusCode: '400', schema: ast.factory.createSchema({ type: 'object' }) }),
      ast.factory.createResponse({ statusCode: 'default', schema: ast.factory.createSchema({ type: 'object' }) }),
    ],
  })

  test('resolves error, success, and all response status names', () => {
    expect(resolveErrorNames(node, resolver)).toStrictEqual(['Status400'])
    expect(resolveSuccessNames(node, resolver)).toStrictEqual(['Status201'])
    expect(resolveStatusCodeNames(node, resolver)).toStrictEqual(['Status201', 'Status400', 'Statusdefault'])
  })

  test('resolves response types', () => {
    expect(resolveResponseTypes(node, resolver)).toStrictEqual([
      [201, 'createPetResponse'],
      [400, 'Status400'],
      ['default', 'createPetResponse'],
    ])
  })
})

describe('buildOptionsSchema', () => {
  test('marks body, path, query, and headers as never when the operation has none of them', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    const schema = ast.schema.narrow(buildOptionsSchema(node, resolver), 'object')!

    expect(schema.type).toBe('object')
    expect(schema.primitive).toBe('object')
    expect(schema.properties?.map((property) => ({ name: property.name, required: property.required, schemaType: property.schema.type }))).toStrictEqual([
      { name: 'body', required: false, schemaType: 'never' },
      { name: 'path', required: false, schemaType: 'never' },
      { name: 'query', required: false, schemaType: 'never' },
      { name: 'headers', required: false, schemaType: 'never' },
    ])
  })

  test.each([
    [true, true],
    [false, false],
    [undefined, false],
  ])('makes body required only when requestBody.required is true (%s)', (required, expected) => {
    const node = ast.factory.createOperation({
      operationId: 'updateUser',
      method: 'PUT',
      path: '/user',
      requestBody: {
        required,
        content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) })],
      },
    })

    const schema = ast.schema.narrow(buildOptionsSchema(node, resolver), 'object')!

    expect(schema.properties?.find((property) => property.name === 'body')?.required).toBe(expected)
    // With no required parameter, the whole options argument follows the body.
    expect(getRequestGroupOptionality(node).isOptional).toBe(!expected)
  })
})

describe('resolveOperationTypeNames', () => {
  test('collects parameter, request, response, and status type names', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'POST',
      path: '/pets/{pet-id}',
      parameters: [
        ast.factory.createParameter({ name: 'pet-id', in: 'path', schema: ast.factory.createSchema({ type: 'string' }) }),
        ast.factory.createParameter({ name: 'page-size', in: 'query', schema: ast.factory.createSchema({ type: 'number' }) }),
        ast.factory.createParameter({ name: 'x-api-key', in: 'header', schema: ast.factory.createSchema({ type: 'string' }) }),
        ast.factory.createParameter({ name: 'session', in: 'cookie', schema: ast.factory.createSchema({ type: 'string' }) }),
      ],
      requestBody: {
        content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) })],
      },
      responses: [
        ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object' }) }),
        ast.factory.createResponse({ statusCode: '400', schema: ast.factory.createSchema({ type: 'object' }) }),
      ],
    })

    expect(resolveOperationTypeNames(node, resolver, { exclude: ['Status200'] })).toStrictEqual([
      'pet-idPathParams',
      'page-sizeQueryParams',
      'x-api-keyHeaderParams',
      'sessionCookieParams',
      'showPetData',
      'showPetResponse',
      'Status400',
    ])
  })

  test('can include only error status type names', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPet',
      method: 'GET',
      path: '/pets/{petId}',
      responses: [
        ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object' }) }),
        ast.factory.createResponse({ statusCode: '404', schema: ast.factory.createSchema({ type: 'object' }) }),
      ],
    })

    expect(resolveOperationTypeNames(node, resolver, { responseStatusNames: 'error' })).toStrictEqual(['showPetResponse', 'Status404'])
  })
})

describe('toResponseContent', () => {
  const pet = ast.factory.createSchema({ type: 'ref', name: 'Pet', schema: ast.factory.createSchema({ type: 'object' }) })
  const typeOf = (contentType: string, schema: ast.SchemaNode = pet) => toResponseContent({ contentType, schema, keysToOmit: ['id'] })

  test('types a body the runtime returns as text as string', () => {
    for (const contentType of ['application/xml', 'application/vnd.noaa.dwml+xml', 'application/yaml', 'text/csv', 'text/plain; charset=utf-8', 'text/*']) {
      expect(typeOf(contentType)).toStrictEqual({ contentType, schema: ast.factory.createSchema({ type: 'string' }), keysToOmit: null })
    }
  })

  test('keeps the schema of a JSON, binary, stream, or wildcard body', () => {
    const blob = ast.factory.createSchema({ type: 'blob' })
    for (const [contentType, schema] of [
      ['application/json', pet],
      ['application/problem+json', pet],
      ['text/event-stream', pet],
      ['image/png', blob],
      ['text/csv', blob],
      ['*/*', pet],
      ['application/*', pet],
      ['application/vnd.github.object', pet],
    ] as const) {
      expect(toResponseContent({ ...ast.factory.createContent({ contentType: contentType, schema: schema, stream: {} }), keysToOmit: ['id'] }).schema).toBe(
        schema,
      )
    }
  })

  test('keeps the item schema of a stream of items', () => {
    expect(toResponseContent({ contentType: 'application/jsonl', schema: pet, stream: { schema: pet } }).schema).toBe(pet)
  })

  test('keeps a string schema on a text body', () => {
    const token = ast.factory.createSchema({ type: 'ref', name: 'Token', schema: ast.factory.createSchema({ type: 'string' }) })
    expect(typeOf('text/plain', token).schema).toBe(token)
  })

  test('types a body the runtime returns as a Blob as blob', () => {
    const svg = typeOf('image/svg+xml', ast.factory.createSchema({ type: 'string' }))
    expect(svg).toStrictEqual({ contentType: 'image/svg+xml', schema: ast.factory.createSchema({ type: 'blob' }), keysToOmit: null })
  })

  test('types a binary schema next to a JSON entry as string, since no parseAs applies', () => {
    const blob = ast.factory.createSchema({ type: 'blob' })
    const entries = [
      { contentType: 'application/geo+json', schema: pet },
      { contentType: 'application/vnd.noaa.dwml+xml', schema: blob },
    ]
    expect(toResponseContent(entries[1]!, entries).schema).toStrictEqual(ast.factory.createSchema({ type: 'string' }))
    expect(toResponseContent(entries[1]!).schema).toBe(blob)
  })

  test('keeps an unknown schema on a non-text body', () => {
    const unknown = ast.factory.createSchema({ type: 'unknown' })
    expect(typeOf('application/x-www-form-urlencoded', unknown).schema).toBe(unknown)
    expect(typeOf('text/plain', unknown).schema).toStrictEqual(ast.factory.createSchema({ type: 'string' }))
  })
})

describe('isEventStream', () => {
  function nodeWithResponseContentType(mediaType: string): ast.OperationNode {
    return ast.factory.createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [ast.factory.createContent({ contentType: mediaType, schema: ast.factory.createSchema({ type: 'object' }), stream: {} })],
        }),
      ],
    })
  }

  test('reads text/event-stream as a stream, ignoring a charset suffix', () => {
    expect(isEventStream(nodeWithResponseContentType('text/event-stream'))).toBe(true)
    expect(isEventStream(nodeWithResponseContentType('text/event-stream; charset=utf-8'))).toBe(true)
  })

  test('keeps an operation that declares another content type next to text/event-stream a normal call', () => {
    const node = ast.factory.createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
            ast.factory.createContent({ contentType: 'text/event-stream', schema: ast.factory.createSchema({ type: 'string' }) }),
          ],
        }),
      ],
    })

    expect(isEventStream(node)).toBe(false)
    expect(hasEventStreamContent(node)).toBe(true)
    expect(getEventStream(node)).toBeNull()
  })

  test('ignores a schema-less text/event-stream next to another content type', () => {
    const node = ast.factory.createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) }),
            ast.factory.createContent({ contentType: 'text/event-stream' }),
          ],
        }),
      ],
    })

    expect(hasEventStreamContent(node)).toBe(false)
  })

  test('finds a stream media type next to another content type on any success response', () => {
    const operation = (contentTypes: Array<string>, schema: ast.SchemaNode | null = ast.factory.createSchema({ type: 'object' })) =>
      ast.factory.createOperation({
        operationId: 'getUpdates',
        method: 'GET',
        path: '/updates',
        responses: [
          ast.factory.createResponse({ statusCode: '200', description: 'no body' }),
          ast.factory.createResponse({ statusCode: '202', content: contentTypes.map((contentType) => ast.factory.createContent({ contentType, schema })) }),
        ],
      })

    expect(hasStreamVariant(operation(['application/json', 'application/jsonl']))).toBe(true)
    expect(hasStreamVariant(operation(['application/json', 'text/event-stream; charset=utf-8']))).toBe(true)
    expect(hasStreamVariant(operation(['application/json', 'application/geo+json-seq']))).toBe(true)
    expect(hasStreamVariant(operation(['application/json', 'application/xml']))).toBe(false)
    // A lone stream is a stream operation, and a variant without a schema is not typed.
    expect(hasStreamVariant(operation(['application/jsonl']))).toBe(false)
    expect(hasStreamVariant(operation(['application/json', 'application/jsonl'], null))).toBe(false)
  })

  test('reads the item shape of the stream', () => {
    const textItem = ast.factory.createOperation({
      operationId: 'streamLines',
      method: 'GET',
      path: '/lines',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [ast.factory.createContent({ contentType: 'text/event-stream', schema: ast.factory.createSchema({ type: 'string' }), stream: {} })],
        }),
      ],
    })
    const member = (name: string, data: ast.SchemaNode) =>
      ast.factory.createSchema({
        type: 'object',
        properties: [
          ast.factory.createProperty({ name: 'event', required: true, schema: ast.factory.createSchema({ type: 'enum', enumValues: [name] }) }),
          ast.factory.createProperty({ name: 'data', schema: data }),
        ],
      })
    const union = ast.factory.createSchema({
      type: 'union',
      members: [member('delta', ast.factory.createSchema({ type: 'object' })), member('ping', ast.factory.createSchema({ type: 'string' }))],
    })
    const typedEvents = ast.factory.createOperation({
      operationId: 'streamChat',
      method: 'POST',
      path: '/chat',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [ast.factory.createContent({ contentType: 'text/event-stream', schema: union, stream: { schema: union, shape: 'event' } })],
        }),
      ],
    })

    expect(getEventStream(textItem)).toBe('data')
    expect(getEventStream(typedEvents)).toBe('event')
  })

  test('keeps event data as text only when every event types it as a string', () => {
    const sse = (schema: ast.SchemaNode | undefined, stream: ast.ContentNode['stream'] = {}) =>
      ast.factory.createOperation({
        operationId: 'streamEvents',
        method: 'GET',
        path: '/events',
        responses: [
          ast.factory.createResponse({ statusCode: '200', content: [ast.factory.createContent({ contentType: 'text/event-stream', schema, stream })] }),
        ],
      })
    const string = ast.factory.createSchema({ type: 'string' })
    const event = (data: ast.SchemaNode) =>
      ast.factory.createSchema({ type: 'object', properties: [ast.factory.createProperty({ name: 'data', schema: data })] })
    const events = (...members: Array<ast.SchemaNode>) => ast.factory.createSchema({ type: 'union', members: members.map(event) })

    expect(hasTextEventData(sse(string))).toBe(true)
    expect(hasTextEventData(sse(string, { schema: string, shape: 'data' }))).toBe(true)
    expect(hasTextEventData(sse(event(string), { schema: event(string), shape: 'event' }))).toBe(true)
    expect(hasTextEventData(sse(undefined, { schema: events(string, string), shape: 'event' }))).toBe(true)
    // Only some events type `data` as a string: named events keep theirs as text, an unnamed one cannot be told apart.
    const named = (name: string, data: ast.SchemaNode) =>
      ast.factory.createSchema({
        type: 'object',
        properties: [
          ast.factory.createProperty({ name: 'event', schema: ast.factory.createSchema({ type: 'enum', enumValues: [name] }) }),
          ast.factory.createProperty({ name: 'data', schema: data }),
        ],
      })
    const mixed = ast.factory.createSchema({ type: 'union', members: [named('note', string), named('tick', ast.factory.createSchema({ type: 'object' }))] })
    expect(hasTextEventData(sse(undefined, { schema: mixed, shape: 'event' }))).toStrictEqual(['note'])
    // A discriminator intersects each event with its pinned name.
    const pinned = ast.factory.createSchema({ type: 'intersection', members: [event(string), named('note', string)] })
    expect(hasTextEventData(sse(undefined, { schema: pinned, shape: 'event' }))).toBe(true)
    // A schema-less stream reads as a blob and keeps the JSON-parse default.
    expect(hasTextEventData(sse(ast.factory.createSchema({ type: 'blob', primitive: 'string' })))).toBe(false)
    expect(hasTextEventData(sse(ast.factory.createSchema({ type: 'object' })))).toBe(false)
    expect(hasTextEventData(sse(undefined, { schema: events(string, ast.factory.createSchema({ type: 'object' })), shape: 'event' }))).toBe(false)
    expect(hasTextEventData(nodeWithResponseContentType('application/json'))).toBe(false)
  })

  test.each([
    ['application/jsonl', 'line'],
    ['application/x-ndjson', 'line'],
    ['application/json-seq', 'line'],
    ['multipart/mixed', null],
    // No stream handler in the client runtime reads this type.
    ['application/x-jsonlines', null],
  ])('reads %s the adapter marks as a stream as %s', (contentType, shape) => {
    const schema = ast.factory.createSchema({ type: 'object' })
    const node = ast.factory.createOperation({
      operationId: 'streamLogs',
      method: 'GET',
      path: '/logs',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [ast.factory.createContent({ contentType: contentType, schema: schema, stream: { schema } })],
        }),
      ],
    })

    expect(getEventStream(node)).toBe(shape)
  })

  test('keeps JSON and binary responses a normal call', () => {
    expect(isEventStream(nodeWithResponseContentType('application/json'))).toBe(false)
    expect(hasEventStreamContent(nodeWithResponseContentType('application/json'))).toBe(false)
    expect(isEventStream(nodeWithResponseContentType('application/octet-stream'))).toBe(false)
  })

  test('keeps a binary body next to an event stream a normal call', () => {
    const node = nodeWithResponseContents([
      { contentType: 'audio/mpeg', schemaType: 'blob' },
      { contentType: 'text/event-stream; charset=utf-8', schemaType: 'object' },
    ])

    expect(isEventStream(node)).toBe(false)
    expect(hasEventStreamContent(node)).toBe(true)
  })
})

function nodeWithResponseContents(entries: Array<{ contentType: string; schemaType: 'blob' | 'object' }>): ast.OperationNode {
  return ast.factory.createOperation({
    operationId: 'speech',
    method: 'POST',
    path: '/speech',
    responses: [
      ast.factory.createResponse({
        statusCode: '200',
        content: entries.map((entry) =>
          ast.factory.createContent({ contentType: entry.contentType, schema: ast.factory.createSchema({ type: entry.schemaType }), stream: {} }),
        ),
      }),
    ],
  })
}

describe('resolveOperationFile', () => {
  function createTestMemo(): Memo {
    const store = new Map<string, unknown>()
    return ((key: string, compute: () => unknown) => {
      if (!store.has(key)) store.set(key, compute())
      return store.get(key)
    }) as Memo
  }

  const ctxOf = (memo: Memo, schemas: Array<ast.SchemaNode> = []) => ({ memo, driver: { inputNode: { schemas } } })

  function createFileResolver(pluginName: string) {
    return { pluginName, file: vi.fn(() => ast.factory.createFile({ path: '/root/getPetById.ts', baseName: 'getPetById.ts' as const })) }
  }

  const node = ast.factory.createOperation({ operationId: 'getPetById', method: 'GET', path: '/pets/{id}' })

  test('reuses the cached file for the same dependency plugin and node instead of resolving again', () => {
    const dependencyResolver = createFileResolver('plugin-ts')
    const memo = createTestMemo()

    const first = resolveOperationFile({ ctx: ctxOf(memo), node, resolver: dependencyResolver, root: '/root', output: { path: '.' } })
    const second = resolveOperationFile({ ctx: ctxOf(memo), node, resolver: dependencyResolver, root: '/root', output: { path: '.' } })

    expect(second).toBe(first)
    expect(dependencyResolver.file).toHaveBeenCalledOnce()
  })

  test('resolves independently per dependency plugin name, even sharing the same memo', () => {
    const tsResolver = createFileResolver('plugin-ts')
    const zodResolver = createFileResolver('plugin-zod')
    const memo = createTestMemo()

    resolveOperationFile({ ctx: ctxOf(memo), node, resolver: tsResolver, root: '/root', output: { path: '.' } })
    resolveOperationFile({ ctx: ctxOf(memo), node, resolver: zodResolver, root: '/root', output: { path: '.' } })

    expect(tsResolver.file).toHaveBeenCalledOnce()
    expect(zodResolver.file).toHaveBeenCalledOnce()
  })

  test('resolves each operation on its own when they have no method or path', () => {
    const tsResolver = createFileResolver('plugin-ts')
    const memo = createTestMemo()

    resolveOperationFile({
      ctx: ctxOf(memo),
      node: ast.factory.createOperation({ operationId: 'publishPet' }),
      resolver: tsResolver,
      root: '/root',
      output: { path: '.' },
    })
    resolveOperationFile({
      ctx: ctxOf(memo),
      node: ast.factory.createOperation({ operationId: 'publishOrder' }),
      resolver: tsResolver,
      root: '/root',
      output: { path: '.' },
    })

    expect(tsResolver.file).toHaveBeenCalledTimes(2)
  })

  describe('when an operation file matches a schema file', () => {
    const pascalResolver = createResolver<PluginType<'plugin-ts'>>({ pluginName: 'plugin-ts', file: createCasedFile(casing.pascal) })
    const output = { path: 'types', mode: 'directory' } as const
    const schemas = (...names: Array<string>) => names.map((name) => ast.factory.createSchema({ type: 'object', name }))
    const resolve = (operationId: string, options: { schemas: ReturnType<typeof schemas>; output?: Output; group?: Group }) =>
      resolveOperationFile({
        ctx: ctxOf(createTestMemo(), options.schemas),
        node: ast.factory.createOperation({ operationId, method: 'GET', path: '/points', tags: ['geo'] }),
        resolver: pascalResolver,
        root: '/root',
        output: options.output ?? output,
        group: options.group,
      }).path

    test('adds an `Operation` suffix when the names match', () => {
      expect(resolve('point', { schemas: schemas('Point') })).toBe('/root/types/PointOperation.ts')
    })

    test('adds the suffix when the names differ only in case', () => {
      expect(resolve('office_weatherstory', { schemas: schemas('OfficeWeatherStory') })).toBe('/root/types/OfficeWeatherstoryOperation.ts')
    })

    test('adds the suffix again when the suffixed name is also a schema', () => {
      expect(resolve('point', { schemas: schemas('PointOperation', 'Point') })).toBe('/root/types/PointOperationOperation.ts')
    })

    test('keeps the name when no schema file matches', () => {
      expect(resolve('point', { schemas: schemas('Gridpoint') })).toBe('/root/types/Point.ts')
    })

    test('keeps the name when grouping puts the operation in another folder', () => {
      expect(resolve('point', { schemas: schemas('Point'), group: { type: 'tag' } })).toBe('/root/types/geo/Point.ts')
    })

    test('keeps the single output file when every declaration shares it', () => {
      expect(resolve('point', { schemas: schemas('Point'), output: { path: 'types.ts', mode: 'file' } })).toBe('/root/types.ts')
    })
  })
})

describe('getStreamFraming', () => {
  test.each([
    ['text/event-stream without framing', { contentType: 'text/event-stream; charset=utf-8' }, 'events'],
    ['JSON Lines without framing', { contentType: 'application/jsonl', stream: {} }, 'lines'],
    ['multipart/mixed with an item schema', { contentType: 'multipart/mixed', stream: {} }, undefined],
    ['plain JSON', { contentType: 'application/json' }, undefined],
  ] as const)('%s', (_, entry, expected) => {
    expect(getStreamFraming(entry)).toBe(expected)
  })
})
