import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { buildStyles } from './styles.ts'

function createOperation(parameters: Array<Parameters<typeof ast.factory.createParameter>[0]>) {
  return ast.factory.createOperation({
    operationId: 'listPets',
    method: 'GET',
    path: '/pets',
    tags: ['pet'],
    parameters: parameters.map((parameter) => ast.factory.createParameter(parameter)),
    responses: [ast.factory.createResponse({ statusCode: '200', schema: ast.factory.createSchema({ type: 'object', properties: [] }), description: 'ok' })],
  })
}

const stringSchema = () => ast.factory.createSchema({ type: 'string' })

describe('buildStyles', () => {
  test('returns null when no parameter carries style or explode', () => {
    const node = createOperation([{ name: 'status', in: 'query', schema: stringSchema() }])
    expect(buildStyles({ node })).toBeNull()
  })

  test('keeps the spec name for header and cookie parameters, quoted when not a bare identifier', () => {
    const node = createOperation([
      { name: 'X-Ids', in: 'header', schema: stringSchema(), style: 'simple', explode: true },
      { name: 'session_id', in: 'cookie', schema: stringSchema(), explode: false },
    ])
    expect(buildStyles({ node })).toBe('{ header: { "X-Ids": { explode: true } }, cookie: { session_id: { explode: false } } }')
  })

  test('emits allowReserved for query parameters only', () => {
    const node = createOperation([
      { name: 'path', in: 'query', schema: stringSchema(), allowReserved: true },
      { name: 'tags', in: 'query', schema: stringSchema(), explode: false, allowReserved: false },
      { name: 'id', in: 'path', schema: stringSchema(), allowReserved: true },
    ])
    expect(buildStyles({ node })).toBe('{ query: { path: { allowReserved: true }, tags: { explode: false, allowReserved: false } } }')
  })

  test('emits the contentType of query, header, and cookie parameters described with content', () => {
    const node = createOperation([
      { name: 'filter', in: 'query', schema: stringSchema(), contentType: 'application/json' },
      { name: 'X-Meta', in: 'header', schema: stringSchema(), contentType: 'application/json' },
      { name: 'prefs', in: 'cookie', schema: stringSchema(), contentType: 'application/json' },
    ])
    expect(buildStyles({ node })).toBe(
      "{ query: { filter: { contentType: 'application/json' } }, header: { \"X-Meta\": { contentType: 'application/json' } }, cookie: { prefs: { contentType: 'application/json' } } }",
    )
  })

  test('quotes a query key that is not a bare identifier', () => {
    const node = createOperation([{ name: '2fa', in: 'query', schema: stringSchema(), explode: true }])
    expect(buildStyles({ node })).toBe('{ query: { "2fa": { explode: true } } }')
  })

  test('emits the encoding of the default request content type as a body group', () => {
    const node = ast.factory.createOperation({
      operationId: 'search',
      method: 'POST',
      path: '/search',
      tags: ['pet'],
      parameters: [ast.factory.createParameter({ name: 'page', in: 'query', schema: stringSchema(), explode: false })],
      requestBody: ast.factory.createRequestBody({
        content: [
          ast.factory.createContent({
            contentType: 'application/x-www-form-urlencoded',
            schema: ast.factory.createSchema({ type: 'object', properties: [] }),
            encoding: { filter: { style: 'deepObject', explode: true }, 'x-meta': { contentType: 'application/json', allowReserved: true } },
          }),
        ],
      }),
      responses: [ast.factory.createResponse({ statusCode: '200', schema: stringSchema(), description: 'ok' })],
    })

    expect(buildStyles({ node })).toBe(
      "{ query: { page: { explode: false } }, body: { filter: { style: 'deepObject', explode: true }, \"x-meta\": { allowReserved: true, contentType: 'application/json' } } }",
    )
  })
})
