import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { buildCallConfig } from './callConfig.ts'

describe('buildCallConfig', () => {
  test('leaves a response that mixes a binary body with an event stream to the runtime media types', () => {
    const node = ast.factory.createOperation({
      operationId: 'speech',
      method: 'POST',
      path: '/speech',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({ contentType: 'audio/mpeg', schema: ast.factory.createSchema({ type: 'blob' }) }),
            ast.factory.createContent({ contentType: 'text/event-stream', schema: ast.factory.createSchema({ type: 'object', properties: [] }) }),
          ],
        }),
      ],
    })

    const { callConfig, eventStream } = buildCallConfig({ node, validatorHooks: null, throwOnErrorDefault: true, returnType: 'full' })

    expect(eventStream).toBe(false)
    expect(callConfig).not.toContain('responseType')
    expect(callConfig).not.toContain('parseAs')
    expect(callConfig).toContain('...config')
  })

  test('reads the body as a blob when every content type is binary', () => {
    const node = ast.factory.createOperation({
      operationId: 'speech',
      method: 'POST',
      path: '/speech',
      responses: [
        ast.factory.createResponse({
          statusCode: '200',
          content: [
            ast.factory.createContent({ contentType: 'audio/mpeg', schema: ast.factory.createSchema({ type: 'blob' }) }),
            ast.factory.createContent({ contentType: 'audio/wav', schema: ast.factory.createSchema({ type: 'blob' }) }),
          ],
        }),
      ],
    })

    const { callConfig } = buildCallConfig({ node, validatorHooks: null, throwOnErrorDefault: true, returnType: 'full' })

    expect(callConfig).toContain(`parseAs: 'blob', ...config`)
    expect(callConfig).not.toContain('audio/mpeg')
  })

  const listPets = ast.factory.createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    parameters: [
      ast.factory.createParameter({ name: 'tags', in: 'query', schema: ast.factory.createSchema({ type: 'string' }), explode: false }),
      ast.factory.createParameter({ name: 'limit', in: 'query', schema: ast.factory.createSchema({ type: 'string' }), explode: true }),
    ],
    responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }) })],
  })
  const validatorHooks = {
    request: null,
    path: null,
    query: null,
    headers: null,
    cookies: null,
    response: 'responseSchema',
    error: null,
    importedZodNames: [],
  }
  const evaluate = (config: object) => {
    const { callConfig } = buildCallConfig({ node: listPets, validatorHooks, throwOnErrorDefault: true, returnType: 'full' })
    const resolveThrowOnError = (value: boolean | undefined, fallback: boolean) => value ?? fallback
    return new Function('config', 'responseSchema', 'resolveThrowOnError', `return ${callConfig}`)(config, 'responseSchema', resolveThrowOnError)
  }

  test('merges a per-call validator with the generated one per key', () => {
    expect(evaluate({ validator: { request: 'bodySchema' } })).toMatchObject({ validator: { request: 'bodySchema', response: 'responseSchema' } })
    expect(evaluate({})).toMatchObject({ validator: { response: 'responseSchema' }, throwOnError: true })
    expect(evaluate({ throwOnError: false })).toMatchObject({ throwOnError: false })
  })

  test('merges per-call styles with the generated ones per parameter', () => {
    expect(evaluate({ styles: { query: { tags: { explode: true } }, header: { 'X-Id': { explode: true } } } })).toMatchObject({
      styles: { query: { tags: { explode: true }, limit: { explode: true } }, header: { 'X-Id': { explode: true } } },
    })
    expect(evaluate({})).toMatchObject({ styles: { query: { tags: { explode: false }, limit: { explode: true } } } })
  })
})
