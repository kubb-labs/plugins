import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { applyMiniModifiers, applyModifiers, lengthChecksMini, lengthConstraints, numberChecksMini, numberConstraints, omitUnwrapChain } from './utils.ts'

// zod picks `z.partialRecord` for these keys.
const isClosedKeySchema = (node: ast.SchemaNode) => ast.schema.is(node, 'enumLike', { follow: ['ref'] })

describe('numberConstraints', () => {
  test('no constraints returns empty string', () => {
    expect(numberConstraints({})).toBe('')
  })

  test('all constraints combined', () => {
    expect(numberConstraints({ min: 1, max: 99, exclusive: { min: 0, max: 100 } })).toBe('.min(1).max(99).gt(0).lt(100)')
  })
})

describe('lengthConstraints', () => {
  test('no constraints returns empty string', () => {
    expect(lengthConstraints({})).toBe('')
  })

  test('regexType constructor emits new RegExp(...)', () => {
    expect(lengthConstraints({ pattern: '^\\d+$', regexType: 'constructor' })).toBe('.regex(new RegExp("^\\\\d+$"))')
  })
})

describe('numberChecksMini', () => {
  test('no constraints returns empty string', () => {
    expect(numberChecksMini({})).toBe('')
  })

  test('all constraints combined', () => {
    expect(numberChecksMini({ min: 1, max: 99, exclusive: { min: 0, max: 100 } })).toBe('.check(z.minimum(1), z.maximum(99), z.gt(0), z.lt(100))')
  })
})

describe('lengthChecksMini', () => {
  test('no constraints returns empty string', () => {
    expect(lengthChecksMini({})).toBe('')
  })

  test('all constraints combined', () => {
    expect(lengthChecksMini({ min: 1, max: 10, pattern: '^[a-z]+$' })).toBe('.check(z.minLength(1), z.maxLength(10), z.regex(/^[a-z]+$/))')
  })

  test('regexType constructor emits new RegExp(...)', () => {
    expect(lengthChecksMini({ pattern: '^\\d+$', regexType: 'constructor' })).toBe('.check(z.regex(new RegExp("^\\\\d+$")))')
  })
})

describe('applyModifiers', () => {
  test('nullish (explicit flag) takes priority over nullable+optional', () => {
    expect(applyModifiers({ value: 'z.string()', nullish: true, nullable: true, optional: true })).toBe('z.string().nullish()')
  })

  test('default value (object)', () => {
    expect(applyModifiers({ value: 'z.object({})', defaultValue: {} })).toBe('z.object({}).default({})')
    expect(applyModifiers({ value: 'outputSchema', optional: true, defaultValue: { path: 'types' } })).toBe('outputSchema.optional().default({"path":"types"})')
  })

  test('bigint schema coerces a numeric default to a BigInt literal', () => {
    const schema = ast.factory.createSchema({ type: 'bigint' })
    expect(applyModifiers({ value: 'z.bigint()', schema, defaultValue: 1 })).toBe("z.bigint().default(BigInt('1'))")
  })

  test('array schema emits an array-literal default', () => {
    const schema = ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] })
    expect(applyModifiers({ value: 'z.array(z.string())', schema, defaultValue: ['a', 'b'] })).toBe('z.array(z.string()).default(["a","b"])')
  })

  test('array schema drops a non-array default', () => {
    const schema = ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] })
    expect(applyModifiers({ value: 'z.array(z.string())', schema, defaultValue: {} })).toBe('z.array(z.string())')
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

describe('isClosedKeySchema', () => {
  test('returns true for enum schemas (including single-value enums)', () => {
    const multi = ast.factory.createSchema({ type: 'enum', enumValues: ['admin', 'editor'] })
    expect(isClosedKeySchema(multi)).toBe(true)

    const single = ast.factory.createSchema({ type: 'enum', enumValues: ['admin'] })
    expect(isClosedKeySchema(single)).toBe(true)
  })

  test('returns true for union of enum schemas', () => {
    const node = ast.factory.createSchema({
      type: 'union',
      members: [
        ast.factory.createSchema({ type: 'enum', enumValues: ['admin'] }),
        ast.factory.createSchema({ type: 'enum', enumValues: ['editor', 'viewer'] }),
      ],
    })
    expect(isClosedKeySchema(node)).toBe(true)
  })

  test('returns false for union containing a string schema', () => {
    const node = ast.factory.createSchema({
      type: 'union',
      members: [ast.factory.createSchema({ type: 'enum', enumValues: ['admin'] }), ast.factory.createSchema({ type: 'string' })],
    })
    expect(isClosedKeySchema(node)).toBe(false)
  })

  test('returns false for string schemas (plain and pattern)', () => {
    expect(isClosedKeySchema(ast.factory.createSchema({ type: 'string' }))).toBe(false)
    expect(isClosedKeySchema(ast.factory.createSchema({ type: 'string', pattern: '^[a-z]+$' }))).toBe(false)
  })

  test('resolves ref to enum schema', () => {
    const refToEnum = ast.factory.createSchema({
      type: 'ref',
      name: 'RoleEnum',
      ref: '#/components/schemas/RoleEnum',
      schema: ast.factory.createSchema({ type: 'enum', enumValues: ['admin', 'editor'] }),
    })
    expect(isClosedKeySchema(refToEnum)).toBe(true)

    const refToString = ast.factory.createSchema({
      type: 'ref',
      name: 'Str',
      ref: '#/components/schemas/Str',
      schema: ast.factory.createSchema({ type: 'string' }),
    })
    expect(isClosedKeySchema(refToString)).toBe(false)
  })
})
