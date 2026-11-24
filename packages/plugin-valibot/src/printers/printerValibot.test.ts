import { ast } from '@internals/ast'
import * as v from 'valibot'
import { describe, expect, test } from 'vitest'
import type { ResolverValibot } from '../types.ts'
import { printerValibot } from './printerValibot.ts'

const { createSchema, createProperty } = ast.factory

const string = () => createSchema({ type: 'string' })
/**
 * Builds an object node. A key that ends in `?` is an optional property.
 */
const object = (properties: Record<string, ast.SchemaNode>, extra: Partial<ast.ObjectSchemaNode> = {}) =>
  createSchema({
    type: 'object',
    primitive: 'object',
    properties: Object.entries(properties).map(([name, schema]) => createProperty({ name: name.replace('?', ''), required: !name.endsWith('?'), schema })),
    ...extra,
  })
const ref = (name: string, schema?: ast.SchemaNode) => createSchema({ type: 'ref', name, ref: `#/components/schemas/${name}`, schema })

const camel = (name: string) => `${name[0]!.toLowerCase()}${name.slice(1)}`
const resolver = {
  name: (name: string) => `${camel(name)}Schema`,
  schema: { inputName: (name: string) => `${camel(name)}InputSchema` },
  memo: (_key: string, compute: () => unknown) => compute(),
} as unknown as ResolverValibot

/**
 * Runs printed code against the real library, with `scope` as the consts a `$ref` resolves to.
 */
function build(code: string, scope: Record<string, unknown> = {}): v.GenericSchema {
  return new Function('v', ...Object.keys(scope), `return ${code}`)(v, ...Object.values(scope))
}

describe('printerValibot', () => {
  const printer = printerValibot({ resolver })
  const print = (node: ast.SchemaNode) => printer.print(node)!

  test('not rejects a value that matches the forbidden schema, alone and beside other keywords', () => {
    const forbidden = createSchema({ type: 'not', members: [createSchema({ type: 'enum', enumValues: ['admin'] })] })
    const alone = build(print(forbidden))
    const beside = build(print(createSchema({ type: 'intersection', members: [string(), forbidden] })))

    expect(v.is(alone, 'admin')).toBe(false)
    expect(v.is(alone, 'guest')).toBe(true)
    expect(v.is(beside, 'admin')).toBe(false)
    expect(v.is(beside, 'guest')).toBe(true)
    expect(v.is(beside, 1)).toBe(false)
  })

  test.each([
    ['any', 'v.any()'],
    ['unknown', 'v.unknown()'],
    ['void', 'v.void()'],
    ['never', 'v.never()'],
    ['boolean', 'v.boolean()'],
    ['null', 'v.null()'],
    ['blob', 'v.blob()'],
    ['ipv4', 'v.pipe(v.string(), v.ipv4())'],
    ['ipv6', 'v.pipe(v.string(), v.ipv6())'],
  ] as const)('scalar type %s', (type, expected) => {
    expect(print(createSchema({ type }))).toBe(expected)
  })

  test.each([
    ['plain string', createSchema({ type: 'string' }), 'v.string()', ['a'], [1]],
    [
      'string with length and pattern',
      createSchema({ type: 'string', min: 2, max: 3, pattern: '^[a-z]+$' }),
      'v.pipe(v.string(), v.minLength(2), v.maxLength(3), v.regex(/^[a-z]+$/))',
      ['ab'],
      ['a', 'abcd', 'AB'],
    ],
    ['base64 string', createSchema({ type: 'string', format: 'byte' }), 'v.pipe(v.string(), v.base64())', ['aGk='], ['?']],
    ['int64 carried as a string', createSchema({ type: 'string', format: 'int64' }), 'v.pipe(v.string(), v.regex(/^-?\\d+$/))', ['-12'], ['1.5']],
    ['uuid', createSchema({ type: 'uuid' }), 'v.pipe(v.string(), v.uuid())', ['6a0d9c0e-52a5-4d59-9c0d-52a54d599c0d'], ['x']],
    ['email', createSchema({ type: 'email', max: 20 }), 'v.pipe(v.string(), v.email(), v.maxLength(20))', ['a@kubb.dev'], ['a']],
    ['url', createSchema({ type: 'url' }), 'v.pipe(v.string(), v.url())', ['https://kubb.dev'], ['kubb']],
    [
      'number with bounds',
      createSchema({ type: 'number', min: 1, exclusive: { max: 5 }, multipleOf: 0.5 }),
      'v.pipe(v.number(), v.minValue(1), v.ltValue(5), v.multipleOf(0.5))',
      [1, 4.5],
      [0, 5, 1.2],
    ],
    ['integer', createSchema({ type: 'integer', max: 10 }), 'v.pipe(v.number(), v.integer(), v.maxValue(10))', [3], [3.5, 11]],
    [
      'bigint converts a JSON number or string',
      createSchema({ type: 'bigint', min: 0 }),
      "v.pipe(v.union([v.bigint(), v.number(), v.string()]), v.toBigint(), v.minValue(BigInt('0')))",
      [1, '2', 3n],
      [1.5, 'x', -1],
    ],
    [
      'int32 keeps to its range, and a tighter bound from the spec wins',
      createSchema({ type: 'integer', format: 'int32', min: 0 }),
      'v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483647))',
      [0, 2147483647],
      [-1, 2147483648],
    ],
    [
      'int64 keeps to its range',
      createSchema({ type: 'bigint', format: 'int64' }),
      "v.pipe(v.union([v.bigint(), v.number(), v.string()]), v.toBigint(), v.minValue(BigInt('-9223372036854775808')), v.maxValue(BigInt('9223372036854775807')))",
      ['9223372036854775807', -5],
      ['9223372036854775808'],
    ],
    [
      'uint64 keeps to its range',
      createSchema({ type: 'bigint', format: 'uint64' }),
      "v.pipe(v.union([v.bigint(), v.number(), v.string()]), v.toBigint(), v.minValue(BigInt('0')), v.maxValue(BigInt('18446744073709551615')))",
      ['18446744073709551615'],
      [-1, '18446744073709551616'],
    ],
    [
      'int8 keeps to its range',
      createSchema({ type: 'integer', format: 'int8' }),
      'v.pipe(v.number(), v.integer(), v.minValue(-128), v.maxValue(127))',
      [-128, 127],
      [-129, 128],
    ],
    [
      'uint16 keeps to its range',
      createSchema({ type: 'integer', format: 'uint16' }),
      'v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(65535))',
      [0, 65535],
      [-1, 65536],
    ],
    ['date as a string', createSchema({ type: 'date', representation: 'string' }), 'v.pipe(v.string(), v.isoDate())', ['2026-01-31'], ['2026-13-01']],
    [
      'datetime',
      createSchema({ type: 'datetime' }),
      'v.pipe(v.string(), v.isoTimestamp())',
      ['2026-01-31T10:00:00Z', '2026-01-31T10:00:00.123+02:00'],
      ['2026-01-31'],
    ],
    ['local datetime stays unchecked', createSchema({ type: 'datetime', local: true }), 'v.string()', ['2026-01-31T10:00:00'], [1]],
    ['time as a string', createSchema({ type: 'time', representation: 'string' }), 'v.string()', ['10:00:00.5Z'], [1]],
    ['string enum', createSchema({ type: 'enum', primitive: 'string', enumValues: ['a', 'b'] }), "v.picklist(['a', 'b'])", ['a'], ['c']],
    ['single value enum', createSchema({ type: 'enum', primitive: 'string', enumValues: ['a'] }), "v.literal('a')", ['a'], ['b']],
    [
      'boolean enum',
      createSchema({ type: 'enum', primitive: 'boolean', enumValues: [true, false] }),
      'v.union([v.literal(true), v.literal(false)])',
      [true],
      ['true'],
    ],
    [
      'array with length and unique items',
      createSchema({ type: 'array', items: [string()], min: 1, unique: true }),
      'v.pipe(v.array(v.string()), v.minLength(1), v.check((items) => new Set(items).size === items.length, "Array entries must be unique"))',
      [['a', 'b']],
      [[], ['a', 'a']],
    ],
    [
      'nullable array item',
      createSchema({ type: 'array', items: [createSchema({ type: 'string', nullable: true })] }),
      'v.array(v.nullable(v.string()))',
      [[null, 'a']],
      [[1]],
    ],
    ['tuple', createSchema({ type: 'tuple', items: [string(), createSchema({ type: 'number' })] }), 'v.tuple([v.string(), v.number()])', [['a', 1]], [['a']]],
    [
      'tuple with rest items',
      createSchema({ type: 'tuple', items: [string()], rest: createSchema({ type: 'number' }) }),
      'v.tupleWithRest([v.string()], v.number())',
      [['a', 1, 2]],
      [['a', 'b']],
    ],
    [
      'union',
      createSchema({ type: 'union', members: [string(), createSchema({ type: 'number', nullable: true })] }),
      'v.union([v.string(), v.nullable(v.number())])',
      ['a', 1, null],
      [true],
    ],
    [
      'record from additionalProperties',
      object({}, { additionalProperties: createSchema({ type: 'number' }) }),
      'v.record(v.string(), v.number())',
      [{ a: 1 }],
      [{ a: 'x' }],
    ],
    [
      'record keyed by an enum accepts a subset of the keys',
      object({}, { propertyNames: createSchema({ type: 'enum', primitive: 'string', enumValues: ['a', 'b'] }) }),
      "v.record(v.picklist(['a', 'b']), v.unknown())",
      [{ a: 1 }],
      [{ c: 1 }],
    ],
    [
      'record from patternProperties',
      object({}, { patternProperties: { '^x-': string() } }),
      'v.record(v.pipe(v.string(), v.regex(/^x-/)), v.string())',
      [{ 'x-a': 'a' }],
      [{ a: 'a' }],
    ],
    ['strict object', object({}, { additionalProperties: false }), 'v.strictObject({})', [{}], [{ a: 1 }]],
    ['loose object', object({}, { additionalProperties: true }), 'v.looseObject({})', [{ a: 1 }], [1]],
    [
      'intersection of two schemas',
      createSchema({ type: 'intersection', members: [createSchema({ type: 'union', members: [string(), createSchema({ type: 'number' })] }), string()] }),
      'v.intersect([v.union([v.string(), v.number()]), v.string()])',
      ['a'],
      [1],
    ],
    [
      'intersection member that only adds constraints',
      createSchema({ type: 'intersection', members: [string(), createSchema({ type: 'string', primitive: 'string', max: 2 })] }),
      'v.pipe(v.string(), v.maxLength(2))',
      ['ab'],
      ['abc'],
    ],
  ] as const)('%s', (_name, node, expected, valid, invalid) => {
    const code = print(node)
    expect(code).toBe(expected)

    const schema = build(code)
    for (const value of valid) expect(v.is(schema, value), `accepts ${String(value)}`).toBe(true)
    for (const value of invalid) expect(v.is(schema, value), `rejects ${String(value)}`).toBe(false)
  })

  test('regexType constructor prints a RegExp call', () => {
    const code = printerValibot({ regexType: 'constructor' }).print(createSchema({ type: 'string', pattern: '^a$' }))!

    expect(code).toBe('v.pipe(v.string(), v.regex(new RegExp("^a$")))')
    expect(v.is(build(code), 'a')).toBe(true)
  })

  describe('object', () => {
    test('wraps optional, nullable, and default properties', () => {
      const code = print(
        object({
          id: createSchema({ type: 'integer' }),
          'name?': string(),
          tag: createSchema({ type: 'string', nullable: true }),
          'note?': createSchema({ type: 'string', nullable: true }),
          status: createSchema({ type: 'string', default: 'new' }),
          rank: createSchema({ type: 'integer', nullable: true, default: 1 }),
        }),
      )

      expect(code).toMatchInlineSnapshot(`
        "v.object({
          id: v.pipe(v.number(), v.integer()),
          name: v.optional(v.string()),
          tag: v.nullable(v.string()),
          note: v.optional(v.nullable(v.string())),
          status: v.optional(v.string(), 'new'),
          rank: v.optional(v.nullable(v.pipe(v.number(), v.integer())), 1),
        })"
      `)
      expect(v.parse(build(code), { id: 1, tag: null, rank: null, extra: true })).toEqual({ id: 1, tag: null, status: 'new', rank: null })
      expect(v.is(build(code), { id: 1 })).toBe(false)
    })

    test('typed additionalProperties next to properties print a rest schema', () => {
      const code = print(object({ id: string() }, { additionalProperties: createSchema({ type: 'number' }) }))

      expect(code).toBe('v.objectWithRest({\n  id: v.string(),\n}, v.number())')
      expect(v.is(build(code), { id: 'a', n: 1 })).toBe(true)
      expect(v.is(build(code), { id: 'a', n: 'x' })).toBe(false)
    })

    test('drops a default that does not fit the schema', () => {
      expect(print(createSchema({ type: 'array', items: [string()], default: {} }))).toBe('v.array(v.string())')
      expect(print(createSchema({ type: 'string', default: null }))).toBe('v.string()')
      // An encode schema takes a `Date`, which a string default does not fit. The decode schema takes the wire string.
      const date = createSchema({ type: 'date', representation: 'date', format: 'date', default: '2020-01-01' })
      expect(printerValibot({ direction: 'encode' }).print(date)).toBe('v.pipe(v.date(), v.transform((value) => value.toISOString().slice(0, 10)))')
      expect(print(date)).toBe("v.optional(v.pipe(v.string(), v.isoDate(), v.transform((value) => new Date(value))), '2020-01-01')")
    })
  })

  describe('ref', () => {
    const petNode = object({ id: string() }, { name: 'Pet' })
    const scope = { petSchema: build(print(petNode)), catSchema: build(print(object({ meow: string() }))) }

    test('resolves the name through the resolver', () => {
      expect(print(ref('Pet', petNode))).toBe('petSchema')
    })

    test('wraps a circular ref in v.lazy', () => {
      const cyclic = printerValibot({ resolver, cyclicSchemas: new Set(['Pet']) })

      expect(cyclic.print(object({ 'parent?': ref('Pet', petNode) }))).toBe('v.object({\n  parent: v.optional(v.lazy(() => petSchema)),\n})')
    })

    test('omits keys from a ref, behind the wrappers its const carries', () => {
      const omit = (target: ast.SchemaNode) => printerValibot({ resolver, keysToOmit: ['id'] }).print(ref('Pet', target))!

      expect(omit(petNode)).toBe("v.omit(petSchema, ['id'])")
      expect(v.parse(build(omit(petNode), scope), { id: 'a' })).toEqual({})

      const nullablePet = { ...petNode, nullable: true, default: { id: 'a' } }
      const code = omit(nullablePet)
      expect(code).toBe('v.optional(v.nullable(v.omit(petSchema.wrapped.wrapped, [\'id\'])), {"id":"a"})')
      expect(v.is(build(code, { petSchema: build(print(nullablePet)) }), null)).toBe(true)
    })

    test('keeps a circular ref as it is, because v.omit cannot type it', () => {
      const cyclic = printerValibot({ resolver, keysToOmit: ['id'], cyclicSchemas: new Set(['Pet']) })

      expect(cyclic.print(ref('Pet', petNode))).toBe('v.lazy(() => petSchema)')
    })

    test.each([
      ['a loose base stays loose', { additionalProperties: true }, 'v.looseObject({\n  ...petSchema.entries,\n  age: v.number(),\n})'],
      ['a strict base stays strict', { additionalProperties: false }, 'v.strictObject({\n  ...petSchema.entries,\n  age: v.number(),\n})'],
      [
        'a base with a rest schema stays in v.intersect',
        { additionalProperties: createSchema({ type: 'number' }) },
        'v.intersect([\n  petSchema,\n  v.object({\n    age: v.number(),\n  }),\n])',
      ],
      [
        'a base with a default is a wrapper, so it stays in v.intersect',
        { default: { id: 'a' } },
        'v.intersect([\n  petSchema,\n  v.object({\n    age: v.number(),\n  }),\n])',
      ],
    ] as const)('an object allOf: %s', (_name, extra, expected) => {
      const node = createSchema({
        type: 'intersection',
        members: [ref('Pet', { ...petNode, ...extra } as ast.SchemaNode), object({ age: createSchema({ type: 'number' }) })],
      })

      expect(print(node)).toBe(expected)
    })

    test('an object allOf prints a property two members declare once', () => {
      const node = createSchema({
        type: 'intersection',
        members: [ref('Pet', petNode), object({ 'age?': string() }), object({ age: createSchema({ type: 'number' }) })],
      })

      expect(print(node)).toBe('v.object({\n  ...petSchema.entries,\n  age: v.number(),\n})')
    })

    test('a discriminated union of object refs prints v.variant', () => {
      const dog = object({ type: createSchema({ type: 'enum', primitive: 'string', enumValues: ['dog'] }) })
      const cat = object({ type: createSchema({ type: 'enum', primitive: 'string', enumValues: ['cat'] }) })
      const node = createSchema({ type: 'union', discriminatorPropertyName: 'type', members: [ref('Dog', dog), ref('Cat', cat)] })
      const code = print(node)

      expect(code).toBe("v.variant('type', [dogSchema, catSchema])")
      const schema = build(code, { dogSchema: build(print(dog)), catSchema: build(print(cat)) })
      expect(v.is(schema, { type: 'cat' })).toBe(true)
      expect(v.is(schema, { type: 'bird' })).toBe(false)
    })

    test('a discriminated union with a circular member falls back to v.union', () => {
      const cyclic = printerValibot({ resolver, cyclicSchemas: new Set(['Pet']) })
      const node = createSchema({ type: 'union', discriminatorPropertyName: 'id', members: [ref('Pet', petNode), ref('Cat')] })

      expect(cyclic.print(node)).toBe('v.union([v.lazy(() => petSchema), catSchema])')
    })

    test('oneOf members are strict, so a value reaches the member it belongs to', () => {
      const node = createSchema({
        type: 'union',
        strategy: 'one',
        members: [ref('Pet', petNode), object({ id: string(), meow: string() })],
      })
      const code = print(node)

      expect(code).toMatchInlineSnapshot(`
        "v.union([
          v.strictObject(petSchema.entries),
          v.strictObject({
            id: v.string(),
            meow: v.string(),
          }),
        ])"
      `)
      expect(v.parse(build(code, scope), { id: 'a', meow: 'b' })).toEqual({ id: 'a', meow: 'b' })
    })

    test("oneOfType 'xor' passes only when exactly one member matches, and keeps extra keys legal", () => {
      const node = createSchema({ type: 'union', strategy: 'one', members: [object({ id: string() }), object({ name: string() })] })
      const schema = build(printerValibot({ oneOfType: 'xor' }).print(node)!)

      expect(v.is(schema, { id: 'a', extra: 1 })).toBe(true)
      expect(v.is(schema, { id: 'a', name: 'b' })).toBe(false)
      expect(v.is(schema, {})).toBe(false)
    })

    test('a oneOf ref that is not a plain object stays as it is', () => {
      const record = object({}, { additionalProperties: string() })
      const node = createSchema({ type: 'union', strategy: 'one', members: [ref('Tags', record), ref('Pet', { ...petNode, nullable: true })] })

      expect(print(node)).toBe('v.union([tagsSchema, petSchema])')
    })

    const oneOf = createSchema({ type: 'union', strategy: 'one', members: [object({ id: string() }), object({ meow: string() })] })

    test('oneOf members next to sibling properties in an allOf are not strict, so the value can carry those properties', () => {
      const node = createSchema({ type: 'intersection', members: [object({ name: string() }), oneOf] })
      const code = print(node)

      expect(code).toMatchInlineSnapshot(`
        "v.intersect([
          v.object({
            name: v.string(),
          }),
          v.union([
            v.object({
              id: v.string(),
            }),
            v.object({
              meow: v.string(),
            }),
          ]),
        ])"
      `)
      expect(v.is(build(code), { name: 'a', id: 'b' })).toBe(true)
    })

    test('oneOf members stay strict when the union is a property, not next to the allOf properties', () => {
      const node = createSchema({ type: 'intersection', members: [object({ name: string() }), object({ kind: oneOf })] })
      const code = print(node)

      expect(code).toMatchInlineSnapshot(`
        "v.object({
          ...v.object({
            name: v.string(),
          }).entries,
          kind: v.union([
            v.strictObject({
              id: v.string(),
            }),
            v.strictObject({
              meow: v.string(),
            }),
          ]),
        })"
      `)
      expect(v.is(build(code), { name: 'a', kind: { id: 'b' } })).toBe(true)
      expect(v.is(build(code), { name: 'a', kind: { id: 'b', meow: 'c' } })).toBe(false)
    })
  })

  test('a description and examples ride along as metadata inside the optional wrapper', () => {
    const node = object({ 'name?': createSchema({ type: 'string', description: 'A "name"', examples: ['Rex', null] }) }, { title: 'Pet', description: 'A pet' })
    const code = print(node)!

    expect(code).toMatchInlineSnapshot(`
      "v.pipe(v.object({
        name: v.optional(v.pipe(v.string(), v.description('A "name"'), v.metadata({ examples: ['Rex', null] }))),
      }), v.title('Pet'), v.description('A pet'))"
    `)
    expect(v.getDescription(build(code))).toBe('A pet')
    expect(v.getTitle(build(code))).toBe('Pet')
    expect(v.parse(build(code), {})).toEqual({})
  })

  test('v.omit reads a described $ref target without its metadata', () => {
    const described = object({ id: string() }, { name: 'Pet', description: 'A pet' })
    const code = printerValibot({ resolver, keysToOmit: ['id'] }).print(ref('Pet', described))!

    expect(code).toBe("v.omit(petSchema.pipe[0], ['id'])")
    expect(v.is(build(code, { petSchema: build(print(described)!) }), {})).toBe(true)
  })

  test('printer.nodes overrides a handler and can reuse the built-in output', () => {
    const custom = printerValibot({
      nodes: {
        string(node) {
          return `v.pipe(${this.base(node)}, v.trim())`
        },
      },
    })

    expect(custom.print(string())).toBe('v.pipe(v.string(), v.trim())')
  })
  describe('coercion', () => {
    const coerced = printerValibot({ coercion: true })

    test.each([
      ['string', createSchema({ type: 'string', min: 1 }), 'v.pipe(v.unknown(), v.toString(), v.minLength(1))', [1, 'a'], ['']],
      ['number', createSchema({ type: 'number', max: 5 }), 'v.pipe(v.unknown(), v.toNumber(), v.maxValue(5))', ['5', 2], ['x', 6]],
      ['integer', createSchema({ type: 'integer' }), 'v.pipe(v.unknown(), v.toNumber(), v.integer())', ['5'], ['5.5']],
      ['date', createSchema({ type: 'date', representation: 'date' }), 'v.pipe(v.unknown(), v.toDate())', ['2026-01-31', 0], ['x']],
    ] as const)('%s', (_name, node, expected, valid, invalid) => {
      const code = coerced.print(node)!
      expect(code).toBe(expected)
      for (const value of valid) expect(v.is(build(code), value)).toBe(true)
      for (const value of invalid) expect(v.is(build(code), value)).toBe(false)
    })

    test('the object form turns it on per type', () => {
      const numbers = printerValibot({ coercion: { numbers: true } })

      expect(numbers.print(createSchema({ type: 'number' }))).toBe('v.pipe(v.unknown(), v.toNumber())')
      expect(numbers.print(string())).toBe('v.string()')
    })
  })

  describe('direction', () => {
    const date = createSchema({ type: 'date', representation: 'date', format: 'date' })
    const datetime = createSchema({ type: 'date', representation: 'date' })
    const time = createSchema({ type: 'time', representation: 'date' })
    const encode = printerValibot({ resolver, direction: 'encode' })

    test('a response decodes a wire string into a Date', () => {
      expect(v.parse(build(print(date)), '2026-01-31')).toEqual(new Date('2026-01-31'))
      expect(v.parse(build(print(datetime)), '2026-01-31T10:00:00Z')).toEqual(new Date('2026-01-31T10:00:00Z'))
      expect(v.parse(build(print(time)), '10:30:00')).toEqual(new Date('1970-01-01T10:30:00Z'))
      expect(v.parse(build(print(time)), '10:30:00Z')).toEqual(new Date('1970-01-01T10:30:00Z'))
      expect(v.parse(build(print(time)), '10:30:00.5+02:00')).toEqual(new Date('1970-01-01T08:30:00.500Z'))
      expect(v.is(build(print(time)), 'x')).toBe(false)
      expect(v.is(build(print(date)), new Date())).toBe(false)
    })

    test('a request encodes a Date back into the wire string', () => {
      const value = new Date('2026-01-31T10:30:00Z')

      expect(v.parse(build(encode.print(date)!), value)).toBe('2026-01-31')
      expect(v.parse(build(encode.print(datetime)!), value)).toBe('2026-01-31T10:30:00.000Z')
      expect(v.parse(build(encode.print(time)!), value)).toBe('10:30:00Z')
      expect(v.parse(build(encode.print(time)!), new Date('2026-01-31T10:30:00.789Z'))).toBe('10:30:00.789Z')
      expect(v.is(build(encode.print(date)!), new Date('x'))).toBe(false)
    })

    test('a request reads a component with a date from its input variant', () => {
      const event = object({ at: date }, { name: 'Event' })

      expect(encode.print(ref('Event', event))).toBe('eventInputSchema')
      expect(print(ref('Event', event))).toBe('eventSchema')
      expect(encode.print(ref('Pet', object({ id: string() })))).toBe('petSchema')
    })

    test('a string date field prints the same in both directions', () => {
      const node = createSchema({ type: 'date', representation: 'string' })

      expect(encode.print(node)).toBe(print(node))
    })
  })

  describe('input checks', () => {
    const number = createSchema({ type: 'number' })

    test('minProperties and maxProperties count the keys of the raw input', () => {
      const code = print(object({ 'id?': string() }, { min: 1, max: 2 }))
      const schema = build(code)

      expect(code).toContain('v.pipe(v.unknown(), v.check(')
      expect(v.is(schema, {})).toBe(false)
      // `extra` is not declared, so the object schema drops it, but it still counts.
      expect(v.is(schema, { extra: 1 })).toBe(true)
      expect(v.is(schema, { a: 1, b: 2, c: 3 })).toBe(false)
    })

    test('propertyNames checks every key of an object that declares properties', () => {
      const keys = createSchema({ type: 'string', pattern: '^[a-z]+$' })
      const schema = build(print(object({ id: string() }, { propertyNames: keys })))

      expect(v.is(schema, { id: 'a', extra: 1 })).toBe(true)
      expect(v.is(schema, { id: 'a', Extra: 1 })).toBe(false)
    })

    test('a strict object with patternProperties takes declared keys and keys that match a pattern', () => {
      const schema = build(print(object({ id: string() }, { additionalProperties: false, patternProperties: { '^x-': number } })))

      expect(v.is(schema, { id: 'a', 'x-rate': 1 })).toBe(true)
      expect(v.is(schema, { id: 'a', other: 1 })).toBe(false)
      expect(v.is(schema, { id: 'a', 'x-rate': 'fast' })).toBe(false)
    })

    test('if/then/else and dependentRequired check the raw input', () => {
      const conditional = object(
        { 'kind?': string(), 'size?': number },
        {
          conditionals: [
            {
              if: object({ kind: createSchema({ type: 'enum', primitive: 'string', enumValues: ['box'] }) }),
              then: object({ size: createSchema({ type: 'unknown' }) }),
            },
          ],
        },
      )
      const schema = build(print(conditional))

      expect(v.is(schema, { kind: 'box', size: 1 })).toBe(true)
      expect(v.is(schema, { kind: 'box' })).toBe(false)
      expect(v.is(schema, { kind: 'bag' })).toBe(true)
    })

    test('contains counts the matching items', () => {
      const node = createSchema({ type: 'array', items: [createSchema({ type: 'unknown' })], contains: { schema: number, min: 1, max: 2 } })
      const schema = build(print(node))

      expect(v.is(schema, ['a', 1])).toBe(true)
      expect(v.is(schema, ['a'])).toBe(false)
      expect(v.is(schema, [1, 2, 3])).toBe(false)
    })

    test('a string with a contentSchema must hold JSON that matches it', () => {
      const node = createSchema({ type: 'string', content: { mediaType: 'application/json', schema: object({ id: number }) } })
      const schema = build(print(node))

      expect(v.is(schema, '{"id":1}')).toBe(true)
      expect(v.is(schema, '{"id":"a"}')).toBe(false)
      expect(v.is(schema, 'not json')).toBe(false)
    })

    test('a schema with input checks is not a plain object for v.variant, a oneOf, or an allOf merge', () => {
      const counted = object({ id: string() }, { min: 1 })
      const union = createSchema({ type: 'union', strategy: 'one', members: [ref('Pet', counted), string()] })
      const merge = createSchema({ type: 'intersection', members: [ref('Pet', counted), object({ age: number })] })

      expect(print(union)).toBe('v.union([petSchema, v.string()])')
      expect(print(merge)).toContain('v.intersect([')
    })

    test('omits keys from the object and keeps the checks around it', () => {
      const counted = object({ 'id?': string(), 'name?': string() }, { min: 1 })
      const omit = printerValibot({ resolver, keysToOmit: ['id'] })
      const refCode = omit.print(ref('Pet', counted))!
      const inlineCode = omit.print(counted)!

      expect(refCode).toBe("v.pipe(v.unknown(), petSchema.pipe[1], v.omit(petSchema.pipe[2], ['id']))")
      for (const schema of [build(refCode, { petSchema: build(print(counted)) }), build(inlineCode)]) {
        expect(v.parse(schema, { id: 'a', name: 'b' })).toEqual({ name: 'b' })
        // `minProperties: 1` still rejects an empty body.
        expect(v.is(schema, {})).toBe(false)
      }

      // A nested object keeps its own checks too.
      const nested = omit.print(object({ id: string(), child: object({ 'name?': string() }, { min: 1 }) }, { min: 1 }))!
      expect(v.is(build(nested), { id: 'a', child: {} })).toBe(false)
      expect(v.is(build(nested), { id: 'a', child: { name: 'b' } })).toBe(true)
    })

    test('omits keys from a nullable allOf of objects', () => {
      const omit = printerValibot({ resolver, keysToOmit: ['id'] })
      const merge = createSchema({ type: 'intersection', primitive: 'object', nullable: true, members: [object({ id: string() }), object({ name: string() })] })
      const schema = build(omit.print(merge)!)

      expect(v.parse(schema, { name: 'b' })).toEqual({ name: 'b' })
      expect(v.parse(schema, null)).toBeNull()
    })

    test('does not omit keys from a schema without entries', () => {
      const omit = printerValibot({ resolver, keysToOmit: ['id'] })
      const a = object({ id: string() })
      const b = object({ name: string() }, { nullable: true })
      const union = createSchema({ type: 'union', primitive: 'object', strategy: 'one', members: [a, object({ name: string() })] })
      const intersection = createSchema({ type: 'intersection', primitive: 'object', members: [ref('A', a), ref('B', b)] })

      expect(omit.print(union)).not.toContain('v.omit(')
      expect(omit.print(ref('I', intersection))).toBe('iSchema')
    })

    test('reaches the object behind an alias of a nullable schema', () => {
      const nullableObject = object({ id: string(), name: string() }, { nullable: true })
      const alias = ref('N', nullableObject)
      const code = printerValibot({ resolver, keysToOmit: ['id'] }).print(ref('Alias', alias))!
      const nSchema = build(print(nullableObject))
      const aliasSchema = build(print(alias), { nSchema })

      expect(code).toBe("v.omit(aliasSchema.wrapped.wrapped, ['id'])")
      expect(v.parse(build(code, { aliasSchema }), { name: 'x' })).toEqual({ name: 'x' })
    })
  })

  describe('allOf members', () => {
    test('an integer member keeps v.integer() on a number base', () => {
      const node = createSchema({
        type: 'intersection',
        members: [ref('Num', createSchema({ type: 'number' })), createSchema({ type: 'integer', min: 0 })],
      })
      const code = print(node)

      expect(code).toBe('v.pipe(numSchema, v.integer(), v.minValue(0))')
      expect(v.is(build(code, { numSchema: v.number() }), 1.5)).toBe(false)
      expect(v.is(build(code, { numSchema: v.number() }), 2)).toBe(true)
    })

    test('a member of a bigint base takes bigint bounds', () => {
      const id = createSchema({ type: 'bigint', format: 'int64' })
      const node = createSchema({ type: 'intersection', members: [ref('Id', id), createSchema({ type: 'integer', min: 0 })] })
      const code = print(node)
      const schema = build(code, { idSchema: build(print(id)) })

      expect(code).toBe("v.pipe(idSchema, v.minValue(BigInt('0')))")
      expect(v.is(schema, 5)).toBe(true)
      expect(v.is(schema, -1)).toBe(false)
    })
  })

  test('a bigint default above the safe integer range prints in full digits', () => {
    const code = print(createSchema({ type: 'bigint', default: 1e21 }))

    expect(code).toContain("BigInt('1000000000000000000000')")
    expect(v.parse(build(code), undefined)).toBe(1000000000000000000000n)
  })

  test('the embedded JSON handler restores the direction when a nested handler throws', () => {
    const throwing = printerValibot({
      direction: 'encode',
      nodes: {
        number() {
          throw new Error('boom')
        },
      },
    })
    const embedded = createSchema({ type: 'string', content: { mediaType: 'application/json', schema: createSchema({ type: 'number' }) } })

    expect(() => throwing.print(embedded)).toThrow('boom')
    expect(throwing.options.direction).toBe('encode')
  })
})
