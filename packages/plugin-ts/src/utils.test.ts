import { buildResponses } from '@internals/shared'
import { ast, Resolver } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { print } from './factory.ts'
import { printerTs } from './printers/printerTs.ts'
import { resolverTs } from './resolvers/resolverTs.ts'
import { buildParams, buildPropertyJSDocComments, buildResponseUnion, resolveInlineEnumNames } from './utils.ts'

describe('resolveInlineEnumNames', () => {
  it.each(['Key', 'Value'])('checks the emitted enum alias with suffix %s', (typeSuffix) => {
    const resolver = Resolver.merge(resolverTs)
    resolver.reserveNames([`StatusEnum${typeSuffix}`, `StatusEnum2${typeSuffix}`])
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({ name: 'status', schema: ast.factory.createSchema({ type: 'enum', name: 'StatusEnum', enumValues: ['on', 'off'] }) }),
      ],
    })
    const options = { node, owner: 'First', resolver, enumOptions: { type: 'asConst', typeSuffix, constCasing: 'camelCase', keyCasing: 'none' } } as const
    const resolved = resolveInlineEnumNames(options)
    expect(resolved).toMatchObject({ properties: [{ schema: { name: 'StatusEnum3' } }] })
    expect(resolveInlineEnumNames(options)).toEqual(resolved)
    expect(resolveInlineEnumNames({ ...options, owner: 'Second' })).toMatchObject({ properties: [{ schema: { name: 'StatusEnum4' } }] })
    expect(resolver.resolveName({ key: 'later', name: 'statusEnum3' })).toBe('statusEnum32')
  })

  it('skips names taken by either the enum value or its type alias', () => {
    const resolver = Resolver.merge(resolverTs)
    resolver.reserveNames(['statusEnum', 'StatusEnum2Key'])
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({ name: 'status', schema: ast.factory.createSchema({ type: 'enum', name: 'StatusEnum', enumValues: ['on', 'off'] }) }),
      ],
    })
    const resolved = resolveInlineEnumNames({
      node,
      owner: 'First',
      resolver,
      enumOptions: { type: 'asConst', typeSuffix: 'Key', constCasing: 'camelCase', keyCasing: 'none' },
    })
    // `StatusEnum` is taken as a value and `StatusEnum2` as a type alias.
    expect(resolved).toMatchObject({ properties: [{ schema: { name: 'StatusEnum3' } }] })
  })
})

const printer = printerTs({
  resolver: resolverTs,
  optionalType: 'questionToken',
  arrayType: 'array',
  enum: { type: 'inlineLiteral', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' },
})
function printSchema(schema: ReturnType<typeof buildParams>): string {
  const node = printer.transform(schema)
  return node ? print(node) : ''
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

    expect(printSchema(buildResponses(node, resolverTs))).toMatchInlineSnapshot(`
      "{
        '200': ListPetsStatus200;
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

    expect(printSchema(buildResponses(node, resolverTs))).toBe('object')
  })
})

describe('buildResponseUnion', () => {
  it('emits a union of 2xx response types only', () => {
    const node = ast.factory.createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      responses: [
        ast.factory.createResponse({ statusCode: '200', description: 'OK', schema: ast.factory.createSchema({ type: 'object' }) }),
        ast.factory.createResponse({ statusCode: '405', description: 'Error', schema: ast.factory.createSchema({ type: 'object' }) }),
      ],
    })

    expect(printSchema(buildResponseUnion(node, { resolver: resolverTs })!)).toMatchInlineSnapshot(`"ListPetsStatus200"`)
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

  it('emits object and array defaults as JSON', () => {
    expect(buildPropertyJSDocComments(ast.factory.createSchema({ type: 'object', default: { path: 'types' } }))).toContain('@default {"path":"types"}')
    expect(buildPropertyJSDocComments(ast.factory.createSchema({ type: 'array', primitive: 'array', default: [] }))).toContain('@default []')
    expect(buildPropertyJSDocComments(ast.factory.createSchema({ type: 'object', default: { note: '*/' } }))).toContain('@default {"note":"*\\/"}')
  })

  it.each(['number', 'integer', 'bigint'] as const)('emits numeric bounds for %s schemas', (type) => {
    const schema = ast.factory.createSchema({ type, min: 0, max: 30 })

    expect(buildPropertyJSDocComments(schema)).toStrictEqual(['@minimum 0', '@maximum 30', `@type ${type}`])
  })

  it('emits length bounds for string schemas', () => {
    const schema = ast.factory.createSchema({ type: 'string', min: 0, max: 30 })

    expect(buildPropertyJSDocComments(schema)).toStrictEqual(['@minLength 0', '@maxLength 30', '@type string'])
  })

  it('does not emit bounds for unconstrained numeric schemas', () => {
    const schema = ast.factory.createSchema({ type: 'integer' })

    expect(buildPropertyJSDocComments(schema)).toStrictEqual([])
  })

  it('does not emit bounds for array schemas', () => {
    const schema = ast.factory.createSchema({ type: 'array', primitive: 'array', min: 1, max: 10 })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toStrictEqual([])
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
