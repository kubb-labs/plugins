import { ast } from '@kubb/kit'
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

const resolver = { name: (name: string) => `${name[0]!.toLowerCase()}${name.slice(1)}Schema` } as ResolverValibot

/**
 * Runs printed code against the real library, with `scope` as the consts a `$ref` resolves to.
 */
function build(code: string, scope: Record<string, unknown> = {}): v.GenericSchema {
  return new Function('v', ...Object.keys(scope), `return ${code}`)(v, ...Object.values(scope))
}

describe('printerValibot', () => {
  const printer = printerValibot({ resolver })
  const print = (node: ast.SchemaNode) => printer.print(node)!

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
      'v.pipe(v.union([v.bigint(), v.number(), v.string()]), v.toBigint(), v.minValue(0n))',
      [1, '2', 3n],
      [1.5, 'x', -1],
    ],
    ['date as a string', createSchema({ type: 'date', representation: 'string' }), 'v.pipe(v.string(), v.isoDate())', ['2026-01-31'], ['2026-13-01']],
    ['date as a Date', createSchema({ type: 'date', representation: 'date' }), 'v.date()', [new Date()], ['2026-01-31']],
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

    test('keeps every key of a circular ref, which v.omit cannot type', () => {
      const cyclic = printerValibot({ resolver, keysToOmit: ['id'], cyclicSchemas: new Set(['Pet']) })

      expect(cyclic.print(ref('Pet', petNode))).toBe('v.lazy(() => petSchema)')
    })

    test('an object allOf merges into one object that keeps required properties', () => {
      const node = createSchema({
        type: 'intersection',
        members: [ref('Pet', petNode), object({ 'id?': string(), age: createSchema({ type: 'number' }) })],
      })
      const code = print(node)

      expect(code).toBe('v.object({\n  ...petSchema.entries,\n  id: v.string(),\n  age: v.number(),\n})')
      expect(v.is(build(code, scope), { id: 'a', age: 1 })).toBe(true)
      expect(v.is(build(code, scope), { age: 1 })).toBe(false)
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

    test('a oneOf ref that is not a plain object stays as it is', () => {
      const record = object({}, { additionalProperties: string() })
      const node = createSchema({ type: 'union', strategy: 'one', members: [ref('Tags', record), ref('Pet', { ...petNode, nullable: true })] })

      expect(print(node)).toBe('v.union([tagsSchema, petSchema])')
    })
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
})
