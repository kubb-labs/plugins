import { ast } from 'kubb/kit'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { printerTs } from './printers/printerTs.ts'
import { resolverTs } from './resolvers/resolverTs.ts'
import { buildParams, buildPropertyJSDocComments, buildResponses, buildResponseUnion } from './utils.ts'

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

    expect(printSchema(buildParams({ params }))).toMatchInlineSnapshot(`
      "{
          petId: string;
      }"
    `)
  })

  it('marks optional params with ?', () => {
    const params = [ast.factory.createParameter({ name: 'limit', schema: ast.factory.createSchema({ type: 'integer' }), in: 'query', required: false })]

    expect(printSchema(buildParams({ params }))).toMatchInlineSnapshot(`
      "{
          limit?: number;
      }"
    `)
  })

  it('emits JSDoc on properties when parameters have descriptions', () => {
    const params = [
      ast.factory.createParameter({
        name: 'limit',
        schema: ast.factory.createSchema({ type: 'integer', description: 'Maximum number of results' }),
        in: 'query',
        required: false,
      }),
    ]

    expect(printSchema(buildParams({ params }))).toMatchInlineSnapshot(`
      "{
          /**
           * @description Maximum number of results
           * @type integer | undefined
          */
          limit?: number;
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

    expect(printSchema(buildResponses(node, { resolver: resolverTs, operationTypes: true }))).toMatchInlineSnapshot(`
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

    expect(printSchema(buildResponses(node, { resolver: resolverTs, operationTypes: true }))).toBe('object')
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

    expect(printSchema(buildResponseUnion(node, { resolver: resolverTs, operationTypes: true })!)).toMatchInlineSnapshot(`"(ListPetsStatus200 | ListPetsStatus405)"`)
  })

  it('references base components instead of status aliases when operationTypes is false', () => {
    const node = ast.factory.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      responses: [
        ast.factory.createResponse({ statusCode: '200', description: 'OK', schema: ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }) }),
        ast.factory.createResponse({ statusCode: '405', description: 'Error', schema: ast.factory.createSchema({ type: 'object' }) }),
      ],
    })

    expect(printSchema(buildResponseUnion(node, { resolver: resolverTs, operationTypes: false })!)).toMatchInlineSnapshot(`"(Pet | ListPetsStatus405)"`)
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

  it('serializes object examples as JSON', () => {
    const schema = ast.factory.createSchema({ type: 'object', examples: [{ cidr: '10.0.0.0/8', label: 'VPC' }] })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toContain('@example {"cidr":"10.0.0.0/8","label":"VPC"}')
  })

  it('serializes array examples as JSON', () => {
    const schema = ast.factory.createSchema({
      type: 'array',
      primitive: 'array',
      examples: [
        [
          { cidr: '10.0.0.0/8', label: 'VPC' },
          { cidr: '203.0.113.5/32', label: 'Office' },
        ],
      ],
    })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toContain('@example [{"cidr":"10.0.0.0/8","label":"VPC"},{"cidr":"203.0.113.5/32","label":"Office"}]')
  })

  it('escapes comment terminators in structured examples', () => {
    const schema = ast.factory.createSchema({ type: 'object', examples: [{ label: '*/' }] })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toContain('@example {"label":"*\\/"}')
  })

  it('omits @type when it would be the only annotation', () => {
    const schema = ast.factory.createSchema({ type: 'string' })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toStrictEqual([])
  })

  it('keeps @type when another annotation already justifies the comment', () => {
    const schema = ast.factory.createSchema({ type: 'string', description: 'A pet name' })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toContain('@type string')
  })
})
