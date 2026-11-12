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
          content: [
            ast.factory.createContent({ contentType: 'text/event-stream', schema: ast.factory.createSchema({ type: 'object', properties: [] }), stream: {} }),
          ],
          description: 'event stream',
        }),
      ],
    })
    const validatorHooks = {
      request: null,
      path: null,
      query: null,
      headers: null,
      cookies: null,
      response: 'streamEventsResponseSchema',
      error: null,
      importedZodNames: [],
    }
    const method = buildSdkMethod({ node, name: 'streamEvents', types: resolverTs, validatorHooks, returnType: 'full', throwOnErrorDefault: true })

    expect(method).toContain('): Unwrappable<StreamResult<StreamEventsResponses, ThrowOnError>>')
    // The runtime validates each event with the response validator, by the event shape the call carries.
    expect(method).toContain(
      `return withUnwrap(apiClient.stream<StreamEventsResponses, ThrowOnError>({ method: 'GET', url: '/events', contentType: { response: 'text/event-stream' }, eventShape: 'data', ...config, validator: { response: streamEventsResponseSchema, ...config.validator }, throwOnError: resolveThrowOnError(config.throwOnError, true) }))`,
    )
    expect(method).not.toMatch(/\) as \w/)

    // A plain custom client gets the same call, with a boolean throwOnError.
    const plain = buildSdkMethod({ node, name: 'streamEvents', types: resolverTs, validatorHooks, returnType: 'plain', throwOnErrorDefault: true })
    expect(plain).toContain('): Promise<StreamResult<StreamEventsResponses, ThrowOnError>>')
    expect(plain).toContain('return apiClient.stream<StreamEventsResponses, ThrowOnError>({')
    expect(plain).toContain('throwOnError: config.throwOnError ?? true })')
  })

  test('returns only the events of a text/event-stream response with returnType data', () => {
    const node = ast.factory.createOperation({
      operationId: 'streamEvents',
      method: 'GET',
      path: '/events',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({ contentType: 'text/event-stream', schema: ast.factory.createSchema({ type: 'object', properties: [] }), stream: {} }),
          ],
          description: 'event stream',
        }),
      ],
    })
    const method = buildSdkMethod({ node, name: 'streamEvents', types: resolverTs, validatorHooks: null, returnType: 'data', throwOnErrorDefault: true })

    expect(method).toContain('): Promise<UnwrappedStreamResult<StreamEventsResponses, ThrowOnError>>')
    expect(method).toContain('return unwrapResult(apiClient.stream<StreamEventsResponses, ThrowOnError>({')
    expect(method).toContain('}), resolveThrowOnError(config.throwOnError, true))')
    expect(method).not.toMatch(/\) as \w/)
  })
})
