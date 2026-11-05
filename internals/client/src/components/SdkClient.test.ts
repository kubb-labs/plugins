import { ast } from '@kubb/kit'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { buildSdkMethod } from './SdkClient.tsx'

describe('buildSdkMethod', () => {
  test.each(['application/json', 'application/x-www-form-urlencoded'])('bakes %s into the call config', (contentType) => {
    const formNode = ast.factory.createOperation({
      operationId: 'postFoo',
      method: 'POST',
      path: '/foo',
      tags: ['foo'],
      requestBody: {
        required: true,
        content: [ast.factory.createContent({ contentType, schema: ast.factory.createSchema({ type: 'string' }) })],
      },
      responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
    })
    const method = buildSdkMethod({ node: formNode, name: 'postFoo', types: resolverTs, validatorHooks: null, returnType: 'full', throwOnErrorDefault: true })

    expect(method).toContain(`url: '/foo', contentType: { request: '${contentType}' }, ...config`)
  })

  test('emits parameter styles like the standalone function', () => {
    const node = ast.factory.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      tags: ['pet'],
      parameters: [ast.factory.createParameter({ name: 'ids', in: 'query', schema: ast.factory.createSchema({ type: 'string' }), explode: false })],
      responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
    })
    const method = buildSdkMethod({ node, name: 'listPets', types: resolverTs, validatorHooks: null, returnType: 'full', throwOnErrorDefault: true })

    expect(method).toContain(`url: '/pets', styles: { query: { ids: { explode: false } } }, ...config`)
  })

  test('returns a typed event stream for a text/event-stream response', () => {
    const node = ast.factory.createOperation({
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
    const validatorHooks = { request: null, path: null, query: null, headers: null, response: 'streamEventsResponseSchema', error: null, importedZodNames: [] }
    const method = buildSdkMethod({ node, name: 'streamEvents', types: resolverTs, validatorHooks, returnType: 'full', throwOnErrorDefault: true })

    expect(method).toContain('): Promise<EventStreamResult<ServerSentEvent<SuccessOf<')
    expect(method).toContain('return toEventStream<ServerSentEvent<SuccessOf<')
    // The response validator runs per event, so it moves from the call config into the stream meta.
    expect(method).toContain(
      `(init) => request({ method: 'GET', url: '/events', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true, ...init })`,
    )
    expect(method).toContain(`config, method: 'GET', shape: 'data', validator: streamEventsResponseSchema })`)

    // A plain custom client gets no stream meta, so its response validator stays in the call config.
    const plain = buildSdkMethod({ node, name: 'streamEvents', types: resolverTs, validatorHooks, returnType: 'plain', throwOnErrorDefault: true })
    expect(plain).toContain('return toEventStream<ServerSentEvent<SuccessOf<')
    expect(plain).toContain('validator: { response: streamEventsResponseSchema }')
    expect(plain).not.toContain('(init) =>')
    expect(plain).not.toContain(', config')
  })
})
