import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import {
  applyMiniModifiers,
  applyModifiers,
  buildEnum,
  buildGroupedParamsSchema,
  formatDefault,
  formatLiteral,
  getCodec,
  hasCodec,
  lengthChecksMini,
  lengthConstraints,
  numberChecksMini,
  numberConstraints,
  omitUnwrapChain,
  shouldCoerce,
} from './utils.ts'

describe('formatDefault', () => {
  test('string value is quoted', () => {
    expect(formatDefault('hello')).toMatchInlineSnapshot(`"'hello'"`)
  })

  test('number value is stringified', () => {
    expect(formatDefault(42)).toBe('42')
  })

  test('boolean value is stringified', () => {
    expect(formatDefault(false)).toBe('false')
  })

  test('object value becomes empty object literal', () => {
    expect(formatDefault({ a: 1 })).toBe('{}')
  })

  test('null produces empty string (not object literal)', () => {
    expect(formatDefault(null)).toBe('')
  })

  test('undefined value becomes empty string', () => {
    expect(formatDefault(undefined)).toBe('')
  })
})

describe('formatLiteral', () => {
  test('string value is quoted', () => {
    expect(formatLiteral('cat')).toMatchInlineSnapshot(`"'cat'"`)
  })

  test('number value is raw', () => {
    expect(formatLiteral(0)).toBe('0')
  })

  test('boolean true is raw', () => {
    expect(formatLiteral(true)).toBe('true')
  })

  test('boolean false is raw', () => {
    expect(formatLiteral(false)).toBe('false')
  })
})

describe('buildEnum', () => {
  test('all-string set uses z.enum', () => {
    expect(buildEnum(['a', 'b', 'c'])).toBe("z.enum(['a', 'b', 'c'])")
  })

  test('single non-string value uses z.literal', () => {
    expect(buildEnum([42])).toBe('z.literal(42)')
  })

  test('numeric set uses z.union of literals', () => {
    expect(buildEnum([200, 400, 500])).toBe('z.union([z.literal(200), z.literal(400), z.literal(500)])')
  })

  test('boolean set uses z.union of literals', () => {
    expect(buildEnum([true, false])).toBe('z.union([z.literal(true), z.literal(false)])')
  })

  test('mixed set uses z.union of literals', () => {
    expect(buildEnum(['a', 1, true])).toBe("z.union([z.literal('a'), z.literal(1), z.literal(true)])")
  })
})

describe('numberConstraints', () => {
  test('no constraints returns empty string', () => {
    expect(numberConstraints({})).toBe('')
  })

  test('min only', () => {
    expect(numberConstraints({ min: 0 })).toBe('.min(0)')
  })

  test('max only', () => {
    expect(numberConstraints({ max: 100 })).toBe('.max(100)')
  })

  test('min and max', () => {
    expect(numberConstraints({ min: 1, max: 10 })).toBe('.min(1).max(10)')
  })

  test('exclusiveMinimum', () => {
    expect(numberConstraints({ exclusiveMinimum: 0 })).toBe('.gt(0)')
  })

  test('exclusiveMaximum', () => {
    expect(numberConstraints({ exclusiveMaximum: 100 })).toBe('.lt(100)')
  })

  test('all constraints combined', () => {
    expect(numberConstraints({ min: 1, max: 99, exclusiveMinimum: 0, exclusiveMaximum: 100 })).toBe('.min(1).max(99).gt(0).lt(100)')
  })

  test('multipleOf only', () => {
    expect(numberConstraints({ multipleOf: 5 })).toBe('.multipleOf(5)')
  })

  test('min, max, and multipleOf combined', () => {
    expect(numberConstraints({ min: 0, max: 100, multipleOf: 10 })).toBe('.min(0).max(100).multipleOf(10)')
  })
})

describe('lengthConstraints', () => {
  test('no constraints returns empty string', () => {
    expect(lengthConstraints({})).toBe('')
  })

  test('min only', () => {
    expect(lengthConstraints({ min: 2 })).toBe('.min(2)')
  })

  test('max only', () => {
    expect(lengthConstraints({ max: 50 })).toBe('.max(50)')
  })

  test('min and max', () => {
    expect(lengthConstraints({ min: 1, max: 255 })).toBe('.min(1).max(255)')
  })

  test('pattern only', () => {
    expect(lengthConstraints({ pattern: '^\\d+$' })).toBe('.regex(/^\\d+$/)')
  })

  test('all constraints combined', () => {
    expect(lengthConstraints({ min: 1, max: 10, pattern: '^[a-z]+$' })).toBe('.min(1).max(10).regex(/^[a-z]+$/)')
  })

  test('regexType literal emits a regex literal', () => {
    expect(lengthConstraints({ pattern: '^\\d+$', regexType: 'literal' })).toBe('.regex(/^\\d+$/)')
  })

  test('regexType constructor emits new RegExp(...)', () => {
    expect(lengthConstraints({ pattern: '^\\d+$', regexType: 'constructor' })).toBe('.regex(new RegExp("^\\\\d+$"))')
  })
})

describe('numberChecksMini', () => {
  test('no constraints returns empty string', () => {
    expect(numberChecksMini({})).toBe('')
  })

  test('min only', () => {
    expect(numberChecksMini({ min: 0 })).toBe('.check(z.minimum(0))')
  })

  test('max only', () => {
    expect(numberChecksMini({ max: 100 })).toBe('.check(z.maximum(100))')
  })

  test('min and max', () => {
    expect(numberChecksMini({ min: 1, max: 10 })).toBe('.check(z.minimum(1), z.maximum(10))')
  })

  test('exclusiveMinimum', () => {
    expect(numberChecksMini({ exclusiveMinimum: 0 })).toBe('.check(z.minimum(0, { exclusive: true }))')
  })

  test('exclusiveMaximum', () => {
    expect(numberChecksMini({ exclusiveMaximum: 100 })).toBe('.check(z.maximum(100, { exclusive: true }))')
  })

  test('all constraints combined', () => {
    expect(numberChecksMini({ min: 1, max: 99, exclusiveMinimum: 0, exclusiveMaximum: 100 })).toBe(
      '.check(z.minimum(1), z.maximum(99), z.minimum(0, { exclusive: true }), z.maximum(100, { exclusive: true }))',
    )
  })

  test('multipleOf only', () => {
    expect(numberChecksMini({ multipleOf: 5 })).toBe('.check(z.multipleOf(5))')
  })

  test('min, max, and multipleOf combined', () => {
    expect(numberChecksMini({ min: 0, max: 100, multipleOf: 10 })).toBe('.check(z.minimum(0), z.maximum(100), z.multipleOf(10))')
  })
})

describe('lengthChecksMini', () => {
  test('no constraints returns empty string', () => {
    expect(lengthChecksMini({})).toBe('')
  })

  test('min only', () => {
    expect(lengthChecksMini({ min: 2 })).toBe('.check(z.minLength(2))')
  })

  test('max only', () => {
    expect(lengthChecksMini({ max: 50 })).toBe('.check(z.maxLength(50))')
  })

  test('min and max', () => {
    expect(lengthChecksMini({ min: 1, max: 255 })).toBe('.check(z.minLength(1), z.maxLength(255))')
  })

  test('pattern only', () => {
    expect(lengthChecksMini({ pattern: '^\\d+$' })).toBe('.check(z.regex(/^\\d+$/))')
  })

  test('all constraints combined', () => {
    expect(lengthChecksMini({ min: 1, max: 10, pattern: '^[a-z]+$' })).toBe('.check(z.minLength(1), z.maxLength(10), z.regex(/^[a-z]+$/))')
  })

  test('regexType constructor emits new RegExp(...)', () => {
    expect(lengthChecksMini({ pattern: '^\\d+$', regexType: 'constructor' })).toBe('.check(z.regex(new RegExp("^\\\\d+$")))')
  })
})

describe('applyModifiers', () => {
  test('value only — no modifiers', () => {
    expect(applyModifiers({ value: 'z.string()' })).toBe('z.string()')
  })

  test('optional', () => {
    expect(applyModifiers({ value: 'z.string()', optional: true })).toBe('z.string().optional()')
  })

  test('nullable', () => {
    expect(applyModifiers({ value: 'z.string()', nullable: true })).toBe('z.string().nullable()')
  })

  test('nullish (explicit flag) takes priority over nullable+optional', () => {
    expect(applyModifiers({ value: 'z.string()', nullish: true, nullable: true, optional: true })).toBe('z.string().nullish()')
  })

  test('nullable and optional combined produce nullish', () => {
    expect(applyModifiers({ value: 'z.string()', nullable: true, optional: true })).toBe('z.string().nullish()')
  })

  test('default value (string)', () => {
    expect(applyModifiers({ value: 'z.string()', defaultValue: 'hi' })).toMatchInlineSnapshot(`"z.string().default('hi')"`)
  })

  test('default value (number)', () => {
    expect(applyModifiers({ value: 'z.number()', defaultValue: 0 })).toBe('z.number().default(0)')
  })

  test('default value (object)', () => {
    expect(applyModifiers({ value: 'z.object({})', defaultValue: {} })).toBe('z.object({}).default({})')
  })

  test('bigint schema coerces a numeric default to a BigInt literal', () => {
    const schema = ast.factory.createSchema({ type: 'bigint' })
    expect(applyModifiers({ value: 'z.bigint()', schema, defaultValue: 1 })).toBe('z.bigint().default(BigInt(1))')
  })

  test('array schema emits an array-literal default', () => {
    const schema = ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] })
    expect(applyModifiers({ value: 'z.array(z.string())', schema, defaultValue: ['a', 'b'] })).toBe('z.array(z.string()).default(["a","b"])')
  })

  test('array schema drops a non-array default', () => {
    const schema = ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] })
    expect(applyModifiers({ value: 'z.array(z.string())', schema, defaultValue: {} })).toBe('z.array(z.string())')
  })

  test('description', () => {
    expect(applyModifiers({ value: 'z.string()', description: 'A name' })).toMatchInlineSnapshot(`"z.string().describe('A name')"`)
  })

  test('examples', () => {
    expect(applyModifiers({ value: 'z.string()', examples: ['a', 'b'] })).toMatchInlineSnapshot(`"z.string().meta({ examples: ['a', 'b'] })"`)
  })

  test('ignores an empty examples array', () => {
    expect(applyModifiers({ value: 'z.string()', examples: [] })).toBe('z.string()')
  })

  test('all modifiers combined', () => {
    expect(
      applyModifiers({ value: 'z.string()', optional: true, nullable: true, defaultValue: 'x', description: 'desc', examples: ['a'] }),
    ).toMatchInlineSnapshot(`"z.string().nullish().default('x').describe('desc').meta({ examples: ['a'] })"`)
  })
})

describe('applyMiniModifiers', () => {
  test('value only — no modifiers', () => {
    expect(applyMiniModifiers({ value: 'z.string()' })).toBe('z.string()')
  })

  test('optional wraps with z.optional()', () => {
    expect(applyMiniModifiers({ value: 'z.string()', optional: true })).toBe('z.optional(z.string())')
  })

  test('nullable wraps with z.nullable()', () => {
    expect(applyMiniModifiers({ value: 'z.string()', nullable: true })).toBe('z.nullable(z.string())')
  })

  test('nullish wraps with z.nullish() and skips individual nullable/optional', () => {
    expect(applyMiniModifiers({ value: 'z.string()', nullish: true, nullable: true, optional: true })).toBe('z.nullish(z.string())')
  })

  test('nullable and optional both applied when not nullish', () => {
    expect(applyMiniModifiers({ value: 'z.string()', nullable: true, optional: true })).toBe('z.optional(z.nullable(z.string()))')
  })

  test('default value', () => {
    expect(applyMiniModifiers({ value: 'z.string()', defaultValue: 'hi' })).toMatchInlineSnapshot(`"z._default(z.string(), 'hi')"`)
  })

  test('default value (object)', () => {
    expect(applyMiniModifiers({ value: 'z.object({})', defaultValue: {} })).toBe('z._default(z.object({}), {})')
  })
})

describe('shouldCoerce', () => {
  test('returns false when coercion is undefined', () => {
    expect(shouldCoerce(undefined, 'strings')).toBe(false)
  })

  test('returns false when coercion is false', () => {
    expect(shouldCoerce(false, 'numbers')).toBe(false)
  })

  test('returns true when coercion is true', () => {
    expect(shouldCoerce(true, 'dates')).toBe(true)
  })

  test('returns true for a specific type that is enabled', () => {
    expect(shouldCoerce({ strings: true, numbers: false, dates: false }, 'strings')).toBe(true)
  })

  test('returns false for a specific type that is disabled', () => {
    expect(shouldCoerce({ strings: true, numbers: false, dates: false }, 'numbers')).toBe(false)
  })
})

describe('buildGroupedParamsSchema', () => {
  test('creates an object schema with primitive: object', () => {
    const params = [ast.factory.createParameter({ name: 'petId', schema: ast.factory.createSchema({ type: 'string' }), in: 'path', required: true })]
    const result = buildGroupedParamsSchema({ params })

    expect(result.type).toBe('object')
    expect(result.primitive).toBe('object')
    expect(result.optional).toBeUndefined()
  })

  test('propagates optional flag', () => {
    const params = [ast.factory.createParameter({ name: 'limit', schema: ast.factory.createSchema({ type: 'integer' }), in: 'query', required: false })]
    const result = buildGroupedParamsSchema({ params, optional: true })

    expect(result.optional).toBe(true)
  })

  test('maps each parameter to a property with matching name and required', () => {
    const params = [
      ast.factory.createParameter({ name: 'id', schema: ast.factory.createSchema({ type: 'string' }), in: 'path', required: true }),
      ast.factory.createParameter({ name: 'q', schema: ast.factory.createSchema({ type: 'string' }), in: 'query', required: false }),
    ]
    const result = buildGroupedParamsSchema({ params })
    const obj = ast.narrowSchema(result, 'object')!

    expect(obj.properties).toHaveLength(2)
    expect(obj.properties![0]!.name).toBe('id')
    expect(obj.properties![0]!.required).toBe(true)
    expect(obj.properties![1]!.name).toBe('q')
    expect(obj.properties![1]!.required).toBe(false)
  })
})

describe('codec', () => {
  test('date-time with representation "date" decodes and encodes', () => {
    const node = ast.factory.createSchema({ type: 'date', representation: 'date', format: 'date-time' })

    const codec = getCodec(node)
    expect(hasCodec(node)).toBe(true)
    expect(codec?.decode(node)).toBe('z.iso.datetime().transform((value) => new Date(value))')
    expect(codec?.encode(node)).toBe('z.date().transform((value) => value.toISOString())')
  })

  test('date with representation "date" preserves YYYY-MM-DD precision', () => {
    const node = ast.factory.createSchema({ type: 'date', representation: 'date', format: 'date' })

    const codec = getCodec(node)
    expect(codec?.decode(node)).toBe('z.iso.date().transform((value) => new Date(value))')
    expect(codec?.encode(node)).toBe('z.date().transform((value) => value.toISOString().slice(0, 10))')
  })

  test('date with representation "string" has no codec', () => {
    const node = ast.factory.createSchema({ type: 'date', representation: 'string', format: 'date-time' })

    expect(hasCodec(node)).toBe(false)
    expect(getCodec(node)).toBeUndefined()
  })

  test('non-registered types have no codec', () => {
    expect(hasCodec(ast.factory.createSchema({ type: 'bigint' }))).toBe(false)
    expect(hasCodec(ast.factory.createSchema({ type: 'string' }))).toBe(false)
    expect(hasCodec(undefined)).toBe(false)
  })
})

describe('omitUnwrapChain', () => {
  test('non-ref schema needs no unwrap', () => {
    expect(omitUnwrapChain(ast.factory.createSchema({ type: 'object', nullable: true }))).toBe('')
  })

  test('plain ref needs no unwrap', () => {
    expect(omitUnwrapChain(ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }))).toBe('')
  })

  test('nullable ref unwraps once', () => {
    expect(omitUnwrapChain(ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', nullable: true }))).toBe('.unwrap()')
  })

  test('optional ref unwraps once', () => {
    expect(omitUnwrapChain(ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', optional: true }))).toBe('.unwrap()')
  })

  test('nullish ref unwraps twice', () => {
    expect(omitUnwrapChain(ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', nullish: true }))).toBe('.unwrap().unwrap()')
  })

  test('nullable ref with a default unwraps twice', () => {
    expect(omitUnwrapChain(ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', nullable: true, default: {} }))).toBe(
      '.unwrap().unwrap()',
    )
  })

  test('reads modifiers from the resolved ref target, not the usage site', () => {
    const node = ast.factory.createSchema({
      type: 'ref',
      name: 'Pet',
      ref: '#/components/schemas/Pet',
      schema: ast.factory.createSchema({ type: 'object', nullable: true }),
    })
    expect(omitUnwrapChain(node)).toBe('.unwrap()')
  })
})
