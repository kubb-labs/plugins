import { ast } from '@kubb/kit'
import { resolverTs } from '@kubb/plugin-ts'
import { describe, expect, test } from 'vitest'
import { buildSdkMethod } from './SdkClient.tsx'

describe('buildSdkMethod', () => {
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

    expect(method).toContain('): Unwrappable<StreamResult<StreamEventsResponses, ThrowOnError>>')
    expect(method).toContain('return withUnwrap(toEventStream<SuccessOf<')
    // The response validator runs per event, so it moves from the call config into the stream meta.
    expect(method).toContain(
      `request({ method: 'GET', url: '/events', responseType: 'stream', ...config, throwOnError: config.throwOnError ?? true }), { client: request, config, shape: 'data', validator: streamEventsResponseSchema })`,
    )

    // A plain custom client gets no stream meta, so its response validator stays in the call config.
    const plain = buildSdkMethod({ node, name: 'streamEvents', types: resolverTs, validatorHooks, returnType: 'plain', throwOnErrorDefault: true })
    expect(plain).toContain('return toEventStream<SuccessOf<')
    expect(plain).toContain('validator: { response: streamEventsResponseSchema }')
    expect(plain).not.toContain(', config')
  })

  test('returns only the events of a text/event-stream response with returnType data', () => {
    const node = ast.factory.createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          mediaType: 'text/event-stream',
          schema: ast.factory.createSchema({ type: 'object', properties: [] }),
          description: 'event stream',
        }),
      ],
    })
    const method = buildSdkMethod({ node, name: 'streamEvents', types: resolverTs, validatorHooks: null, returnType: 'data', throwOnErrorDefault: true })

    expect(method).toContain('): Promise<UnwrappedStreamResult<StreamEventsResponses, ThrowOnError>>')
    expect(method).toContain('return unwrapResult(toEventStream<SuccessOf<')
    expect(method).toContain('config.throwOnError ?? true) as Promise<UnwrappedStreamResult<StreamEventsResponses, ThrowOnError>>')
  })
})
