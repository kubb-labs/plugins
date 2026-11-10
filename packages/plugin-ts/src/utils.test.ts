import { buildResponses } from '@internals/shared'
import { ast, Resolver } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { print } from './factory.ts'
import { printerTs } from './printers/printerTs.ts'
import { resolverTs } from './resolvers/resolverTs.ts'
import { buildParams, buildPropertyJSDocComments, buildResponseComments, getExampleValues, isBinarySchema, resolveInlineEnumNames } from './utils.ts'

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

  it('keeps serialized examples out of examples unless asked for', () => {
    const params = [
      ast.factory.createParameter({
        name: 'status',
        schema: ast.factory.createSchema({ type: 'string' }),
        in: 'query',
        required: true,
        examples: [{ value: 'settled' }, { serializedValue: 'status=settled' }],
      }),
    ]
    const examples = (schema: ast.SchemaNode) => ast.narrowSchema(schema, 'object')?.properties?.[0]?.schema.examples

    expect(examples(buildParams({ params }))).toStrictEqual(['settled'])
    expect(examples(buildParams({ params, serializedExamples: true }))).toStrictEqual(['settled', '<caption>Serialized</caption> status=settled'])
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

  it('does not emit @description when neither description nor format exist', () => {
    const schema = ast.factory.createSchema({ type: 'string' })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).not.toContain('@description')
  })

  it('detects a binary schema or a binary array, and leaves the @type tag off it', () => {
    const blob = ast.factory.createSchema({ type: 'blob', primitive: 'string', description: 'The photo' })

    expect(isBinarySchema(blob)).toBe(true)
    expect(isBinarySchema(ast.factory.createSchema({ type: 'array', primitive: 'array', items: [blob] }))).toBe(true)
    expect(isBinarySchema(ast.factory.createSchema({ type: 'array', primitive: 'array', items: [ast.factory.createSchema({ type: 'string' })] }))).toBe(false)
    // `@type string` would contradict the `Blob` type next to it.
    expect(buildPropertyJSDocComments(blob)).toStrictEqual(['@description The photo'])
  })

  it('emits one @example per entry in the examples array', () => {
    const schema = ast.factory.createSchema({ type: 'string', examples: ['a', 'b'] })
    const comments = buildPropertyJSDocComments(schema)

    expect(comments).toContain('@example a')
    expect(comments).toContain('@example b')
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

describe('buildResponseComments', () => {
  it('prints the summary and one @see per link with the values it fills in', () => {
    const response = ast.factory.createResponse({
      statusCode: '201',
      summary: 'Created',
      links: { getPet: { operationId: 'getPet', parameters: { petId: '$response.body#/id' } }, list: { operationRef: '#/paths/~1pets/get' } },
    })
    expect(buildResponseComments(response)).toStrictEqual([
      '@summary Created',
      '@see getPet: getPet({ petId: $response.body#/id })',
      '@see list: #/paths/~1pets/get()',
    ])
  })
})

describe('getExampleValues', () => {
  it('keeps the value and adds the serialized form under a caption', () => {
    expect(getExampleValues([{ value: { name: 'Rex' }, serializedValue: 'name=Rex' }, { serializedValue: 'a=*/' }], true)).toStrictEqual([
      { name: 'Rex' },
      '<caption>Serialized</caption> name=Rex',
      '<caption>Serialized</caption> a=*\\/',
    ])
    expect(getExampleValues([{ summary: 'empty' }])).toBeUndefined()
  })
})
