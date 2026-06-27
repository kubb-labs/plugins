import { ast } from '@kubb/core'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { printerTs } from './printers/printerTs.ts'
import { resolverTs } from './resolvers/resolverTs.ts'
import { buildData, buildParams, buildPropertyJSDocComments, buildResponses, buildResponseUnion } from './utils.ts'

const printer = printerTs({
  resolver: resolverTs,
  optionalType: 'questionToken',
  arrayType: 'array',
  enum: { type: 'inlineLiteral', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' },
})
const tsPrinter = ts.createPrinter()
const sourceFile = ts.createSourceFile('', '', ts.ScriptTarget.Latest)

function printSchema(schema: ReturnType<typeof buildParams>): string {
  const node = printer.transform(schema)

  if (!node) return ''

  return tsPrinter.printNode(ts.EmitHint.Unspecified, node, sourceFile)
}

describe('buildParams', () => {
  it('builds required params as non-optional properties', () => {
    const params = [ast.factory.createParameter({ name: 'petId', schema: ast.factory.createSchema({ type: 'string' }), in: 'path', required: true })]
    const node = ast.factory.createOperation({ operationId: 'showPetById', method: 'GET', path: '/pets/{petId}' })

    expect(printSchema(buildParams(node, { params, resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          petId: ShowPetByIdPathPetId;
      }"
    `)
  })

  it('marks optional params with ?', () => {
    const params = [ast.factory.createParameter({ name: 'limit', schema: ast.factory.createSchema({ type: 'integer' }), in: 'query', required: false })]
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(printSchema(buildParams(node, { params, resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          limit?: ListPetsQueryLimit;
      }"
    `)
  })
})

describe('buildData', () => {
  const baseNode = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

  it('emits body?: never when no request body', () => {
    const node = ast.factory.createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(printSchema(buildData(node, { resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          body?: never;
          path?: never;
          query?: never;
          headers?: never;
      }"
    `)
  })

  it('emits required body referencing the Data type when body exists', () => {
    const node = ast.factory.createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      requestBody: { content: [ast.factory.createContent({ contentType: 'application/json', schema: ast.factory.createSchema({ type: 'object' }) })] },
    })

    expect(printSchema(buildData(node, { resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          body: CreatePetData;
          path?: never;
          query?: never;
          headers?: never;
      }"
    `)
  })

  it('emits optional path when path parameters exist', () => {
    const node = ast.factory.createOperation({
      operationId: 'showPetById',
      method: 'GET',
      path: '/pets/{petId}',
      parameters: [ast.factory.createParameter({ name: 'petId', schema: ast.factory.createSchema({ type: 'string' }), in: 'path', required: true })],
    })

    expect(printSchema(buildData(node, { resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          body?: never;
          /**
           * @type object
          */
          path: {
              petId: ShowPetByIdPathPetId;
          };
          query?: never;
          headers?: never;
      }"
    `)
  })

  it('emits optional query when query parameters exist', () => {
    const node = ast.factory.createOperation({
      ...baseNode,
      operationId: 'listPets',
      parameters: [ast.factory.createParameter({ name: 'limit', schema: ast.factory.createSchema({ type: 'integer' }), in: 'query', required: false })],
    })

    expect(printSchema(buildData(node, { resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          body?: never;
          path?: never;
          /**
           * @type object | undefined
          */
          query?: {
              limit?: ListPetsQueryLimit;
          };
          headers?: never;
      }"
    `)
  })

  it('emits JSDoc on query properties when parameters have descriptions', () => {
    const node = ast.factory.createOperation({
      ...baseNode,
      operationId: 'listPets',
      parameters: [
        ast.factory.createParameter({
          name: 'limit',
          schema: ast.factory.createSchema({ type: 'integer', description: 'Maximum number of results' }),
          in: 'query',
          required: false,
        }),
      ],
    })

    expect(printSchema(buildData(node, { resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          body?: never;
          path?: never;
          /**
           * @type object | undefined
          */
          query?: {
              limit?: ListPetsQueryLimit;
          };
          headers?: never;
      }"
    `)
  })
})

describe('buildResponses', () => {
  it('emits a keyed object type for responses with schemas', () => {
    const node = ast.factory.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      responses: [
        ast.factory.createResponse({ statusCode: '200', description: 'OK', schema: ast.factory.createSchema({ type: 'object' }) }),
        ast.factory.createResponse({ statusCode: 'default', description: 'Error', schema: ast.factory.createSchema({ type: 'object' }) }),
      ],
    })

    expect(printSchema(buildResponses(node, { resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          "200": ListPetsStatus200;
          default: ListPetsStatusDefault;
      }"
    `)
  })

  it('emits an empty object type for an operation with no responses', () => {
    const node = ast.factory.createOperation({
      operationId: 'noResponses',
      method: 'GET',
      path: '/pets',
      responses: [],
    })

    expect(printSchema(buildResponses(node, { resolver: resolverTs }))).toBe('object')
  })
})

describe('buildResponseUnion', () => {
  it('emits a union of all response types', () => {
    const node = ast.factory.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      responses: [
        ast.factory.createResponse({ statusCode: '200', description: 'OK', schema: ast.factory.createSchema({ type: 'object' }) }),
        ast.factory.createResponse({ statusCode: '405', description: 'Error', schema: ast.factory.createSchema({ type: 'object' }) }),
      ],
    })

    expect(printSchema(buildResponseUnion(node, { resolver: resolverTs })!)).toMatchInlineSnapshot(`"(ListPetsStatus200 | ListPetsStatus405)"`)
  })
})

describe('buildPropertyJSDocComments', () => {
  it('emits @description, @deprecated and @default for a richly annotated schema', () => {
    const schema = ast.factory.createSchema({ type: 'string', description: 'A pet name', deprecated: true, default: 'Fluffy' })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toContain('@description A pet name')
    expect(comments).toContain('@deprecated')
    expect(comments).toContain("@default 'Fluffy'")
  })

  it('does not emit @minLength/@maxLength for array schemas', () => {
    const schema = ast.factory.createSchema({ type: 'array', primitive: 'array', min: 1, max: 10 })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).not.toContain('@minLength 1')
    expect(comments).not.toContain('@maxLength 10')
  })

  it('emits format on a separate line when both description and format exist', () => {
    const schema = ast.factory.createSchema({ type: 'string', format: 'uuid', description: 'Unique identifier' })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toContain('@description Unique identifier')
    expect(comments).toContain(' ')
    expect(comments).toContain('Format: `uuid`')
  })

  it('emits @description and Format on separate lines when only format exists', () => {
    const schema = ast.factory.createSchema({ type: 'string', format: 'date-time' })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toContain('@description')
    expect(comments).toContain('Format: `date-time`')
  })

  it('does not emit @description when neither description nor format exist', () => {
    const schema = ast.factory.createSchema({ type: 'string' })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).not.toContain('@description')
  })

  it('emits one @example per entry in the examples array', () => {
    const schema = ast.factory.createSchema({ type: 'string', examples: ['a', 'b'] })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toContain('@example a')
    expect(comments).toContain('@example b')
  })
})
