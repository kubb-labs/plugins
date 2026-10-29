import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import {
  applyMiniModifiers,
  applyModifiers,
  buildEnum,
  defaultLiteral,
  formatDefault,
  isClosedKeySchema,
  isObjectComposableIntersection,
  isObjectSchemaNode,
  isPlainInlineObject,
  lengthChecksMini,
  lengthConstraints,
  numberChecksMini,
  numberConstraints,
  omitUnwrapChain,
} from './utils.ts'

describe('formatDefault', () => {
  test('object value keeps its contents', () => {
    expect(formatDefault({})).toBe('{}')
    expect(formatDefault({ path: 'types', barrel: { type: 'named' } })).toBe('{"path":"types","barrel":{"type":"named"}}')
  })

  test('array value keeps its contents', () => {
    expect(formatDefault([])).toBe('[]')
    expect(formatDefault(['content'])).toBe('["content"]')
  })

  test('null produces empty string (not object literal)', () => {
    expect(formatDefault(null)).toBe('')
  })

  test('undefined value becomes empty string', () => {
    expect(formatDefault(undefined)).toBe('')
  })
})

describe('defaultLiteral', () => {
  test('a null default is dropped so no bare .default() is emitted', () => {
    expect(defaultLiteral(ast.factory.createSchema({ type: 'object', primitive: 'object' }), null)).toBeNull()
  })

  test('a string default on a numeric enum is coerced to the matching member literal', () => {
    const node = ast.factory.createSchema({ type: 'enum', enumValues: [1, 3] })
    expect(defaultLiteral(node, '1')).toBe('1')
  })

  test('an enum default that matches no member is dropped', () => {
    const node = ast.factory.createSchema({ type: 'enum', enumValues: [1, 3] })
    expect(defaultLiteral(node, '2')).toBeNull()
  })

  test('a string-enum default keeps its quoted literal', () => {
    const node = ast.factory.createSchema({ type: 'enum', enumValues: ['a', 'b'] })
    expect(defaultLiteral(node, 'a')).toBe("'a'")
  })

  test('a plain string default is quoted', () => {
    expect(defaultLiteral(ast.factory.createSchema({ type: 'string' }), 'x')).toBe("'x'")
  })

  test('an array default reached through a $ref stays an array literal', () => {
    const node = ast.factory.createSchema({
      type: 'ref',
      name: 'Resources',
      ref: '#/components/schemas/Resources',
      schema: ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] }),
    })
    expect(defaultLiteral(node, [])).toBe('[]')
    expect(defaultLiteral(node, ['content'])).toBe('["content"]')
    expect(defaultLiteral(node, {})).toBeNull()
  })

  test('a bigint default reached through a $ref is wrapped in BigInt(...)', () => {
    const node = ast.factory.createSchema({
      type: 'ref',
      name: 'Id',
      ref: '#/components/schemas/Id',
      schema: ast.factory.createSchema({ type: 'bigint' }),
    })
    expect(defaultLiteral(node, 0)).toBe('BigInt(0)')
    expect(defaultLiteral(node, 42)).toBe('BigInt(42)')
    expect(defaultLiteral(node, 'invalid')).toBeNull()
  })

  test('an enum default reached through a $ref coerces and drops correctly', () => {
    const node = ast.factory.createSchema({
      type: 'ref',
      name: 'Priority',
      ref: '#/components/schemas/Priority',
      schema: ast.factory.createSchema({ type: 'enum', enumValues: [1, 3] }),
    })
    expect(defaultLiteral(node, '1')).toBe('1')
    expect(defaultLiteral(node, '2')).toBeNull()
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
})

describe('numberConstraints', () => {
  test('no constraints returns empty string', () => {
    expect(numberConstraints({})).toBe('')
  })

  test('all constraints combined', () => {
    expect(numberConstraints({ min: 1, max: 99, exclusiveMinimum: 0, exclusiveMaximum: 100 })).toBe('.min(1).max(99).gt(0).lt(100)')
  })
})

describe('lengthConstraints', () => {
  test('no constraints returns empty string', () => {
    expect(lengthConstraints({})).toBe('')
  })

  test('all constraints combined', () => {
    expect(lengthConstraints({ min: 1, max: 10, pattern: '^[a-z]+$' })).toBe('.min(1).max(10).regex(/^[a-z]+$/)')
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
    expect(numberChecksMini({ min: 1, max: 99, exclusiveMinimum: 0, exclusiveMaximum: 100 })).toBe(
      '.check(z.minimum(1), z.maximum(99), z.minimum(0, { exclusive: true }), z.maximum(100, { exclusive: true }))',
    )
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

  test('nullable and optional combined produce nullish', () => {
    expect(applyModifiers({ value: 'z.string()', nullable: true, optional: true })).toBe('z.string().nullish()')
  })

  test('default value (object)', () => {
    expect(applyModifiers({ value: 'z.object({})', defaultValue: {} })).toBe('z.object({}).default({})')
    expect(applyModifiers({ value: 'outputSchema', optional: true, defaultValue: { path: 'types' } })).toBe('outputSchema.optional().default({"path":"types"})')
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

describe('isObjectSchemaNode', () => {
  test('plain object with properties returns true', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
    })
    expect(isObjectSchemaNode(node)).toBe(true)
  })

  test('open object with additionalProperties: true returns true', () => {
    const id = ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) })
    expect(isObjectSchemaNode(ast.factory.createSchema({ type: 'object', properties: [], additionalProperties: true }))).toBe(true)
    expect(isObjectSchemaNode(ast.factory.createSchema({ type: 'object', properties: [id], additionalProperties: true }))).toBe(true)
  })

  test('strict object with additionalProperties: false returns true', () => {
    const node = ast.factory.createSchema({ type: 'object', properties: [], additionalProperties: false })
    expect(isObjectSchemaNode(node)).toBe(true)
  })

  test('object with properties and typed additionalProperties returns true (catchall)', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
      additionalProperties: ast.factory.createSchema({ type: 'string' }),
    })
    expect(isObjectSchemaNode(node)).toBe(true)
  })

  test('dictionary with empty properties and typed additionalProperties returns false (record)', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [],
      additionalProperties: ast.factory.createSchema({ type: 'string' }),
    })
    expect(isObjectSchemaNode(node)).toBe(false)
  })

  test('object with empty properties and patternProperties returns false (record)', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [],
      patternProperties: { '^[a-z]+$': ast.factory.createSchema({ type: 'string' }) },
    })
    expect(isObjectSchemaNode(node)).toBe(false)
  })

  test('object with empty properties and propertyNames returns false (record)', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [],
      propertyNames: ast.factory.createSchema({ type: 'string', pattern: '^[a-z]+$' }),
    } as any)
    expect(isObjectSchemaNode(node)).toBe(false)
  })

  test('nullable, optional, or nullish object returns false', () => {
    expect(isObjectSchemaNode(ast.factory.createSchema({ type: 'object', nullable: true }))).toBe(false)
    expect(isObjectSchemaNode(ast.factory.createSchema({ type: 'object', optional: true }))).toBe(false)
    expect(isObjectSchemaNode(ast.factory.createSchema({ type: 'object', nullish: true }))).toBe(false)
  })

  test('ref resolving to record returns false, ref resolving to object returns true', () => {
    const recordRef = ast.factory.createSchema({
      type: 'ref',
      name: 'Dict',
      ref: '#/components/schemas/Dict',
      schema: ast.factory.createSchema({
        type: 'object',
        properties: [],
        additionalProperties: ast.factory.createSchema({ type: 'string' }),
      }),
    })
    expect(isObjectSchemaNode(recordRef)).toBe(false)

    const objectRef = ast.factory.createSchema({
      type: 'ref',
      name: 'User',
      ref: '#/components/schemas/User',
      schema: ast.factory.createSchema({
        type: 'object',
        properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
      }),
    })
    expect(isObjectSchemaNode(objectRef)).toBe(true)
  })
})

describe('isObjectComposableIntersection', () => {
  test('intersection with plain object members returns true', () => {
    const node = ast.factory.createSchema({
      type: 'intersection',
      members: [
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
      ],
    })
    expect(isObjectComposableIntersection(node)).toBe(true)
  })

  test('intersection where a member has propertyNames returns false', () => {
    const node = ast.factory.createSchema({
      type: 'intersection',
      members: [
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
        ast.factory.createSchema({
          type: 'object',
          properties: [],
          propertyNames: ast.factory.createSchema({ type: 'string', pattern: '^[a-z]+$' }),
        } as any),
      ],
    })
    expect(isObjectComposableIntersection(node)).toBe(false)
  })

  test('intersection where a member has typed additionalProperties returns false', () => {
    const node = ast.factory.createSchema({
      type: 'intersection',
      members: [
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
        ast.factory.createSchema({
          type: 'object',
          properties: [],
          additionalProperties: ast.factory.createSchema({ type: 'string' }),
        }),
      ],
    })
    expect(isObjectComposableIntersection(node)).toBe(false)
  })
})

describe('isPlainInlineObject', () => {
  test('plain object returns true', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
    })
    expect(isPlainInlineObject(node)).toBe(true)
  })

  test('nullable, optional, or nullish object returns false', () => {
    expect(isPlainInlineObject(ast.factory.createSchema({ type: 'object', nullable: true }))).toBe(false)
    expect(isPlainInlineObject(ast.factory.createSchema({ type: 'object', optional: true }))).toBe(false)
    expect(isPlainInlineObject(ast.factory.createSchema({ type: 'object', nullish: true }))).toBe(false)
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
