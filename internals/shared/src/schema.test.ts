import { ast } from '@internals/ast'
import { describe, expect, test } from 'vitest'
import { defaultLiteral, formatDefault, getChecks, getObjectKind, schemaComments, shouldCoerce, withFormatRange, isComposedObject } from './schema.ts'

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

  test('a default on a binary schema is dropped, since a Blob has no literal', () => {
    expect(defaultLiteral(ast.factory.createSchema({ type: 'blob' }), 'data:text/plain;base64,dGVzdDE=')).toBeNull()
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
    expect(defaultLiteral(node, 0)).toBe("BigInt('0')")
    expect(defaultLiteral(node, 42)).toBe("BigInt('42')")
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

describe('withFormatRange', () => {
  test('adds the range of the format as digit strings', () => {
    expect(withFormatRange({ format: 'int64' }, 'bigint')).toStrictEqual({ format: 'int64', min: '-9223372036854775808', max: '9223372036854775807' })
    expect(withFormatRange({ format: 'uint32' }, 'integer')).toStrictEqual({ format: 'uint32', min: '0', max: '4294967295' })
    expect(withFormatRange({ format: 'int8' }, 'integer')).toStrictEqual({ format: 'int8', min: '-128', max: '127' })
    expect(withFormatRange({ format: 'uint16' }, 'integer')).toStrictEqual({ format: 'uint16', min: '0', max: '65535' })
  })

  test('keeps a bound from the spec that is tighter, and replaces a looser one', () => {
    expect(withFormatRange({ format: 'int32', min: 0, max: 5e9 }, 'integer')).toStrictEqual({ format: 'int32', min: 0, max: '2147483647' })
  })

  test('leaves a schema alone when the format has no range for that type', () => {
    expect(withFormatRange({ format: 'int64', min: 1 }, 'integer')).toStrictEqual({ format: 'int64', min: 1 })
    expect(withFormatRange({ min: 1 }, 'bigint')).toStrictEqual({ min: 1 })
  })
})

describe('schemaComments', () => {
  test('escapes a line that starts with @, so the description cannot add a JSDoc tag', () => {
    const node = ast.factory.createSchema({ type: 'string', description: 'A pet\n@internal use v2', deprecated: true })

    expect(schemaComments(node)).toStrictEqual(['A pet\n\\@internal use v2', '@deprecated'])
  })

  test('a $ref const takes no comment', () => {
    expect(schemaComments(ast.factory.createSchema({ type: 'ref', name: 'Pet', description: 'A pet' }))).toStrictEqual([])
  })
})

describe('shouldCoerce', () => {
  test('coercion is on for true or for the named type', () => {
    expect(shouldCoerce(true, 'dates')).toBe(true)
    expect(shouldCoerce({ numbers: true }, 'numbers')).toBe(true)
    expect(shouldCoerce({ numbers: true }, 'strings')).toBe(false)
    expect(shouldCoerce(undefined, 'strings')).toBe(false)
  })
})

const string = ast.factory.createSchema({ type: 'string' })
const properties = [ast.factory.createProperty({ name: 'id', schema: string, required: true })]

describe('getChecks', () => {
  test('lists property counts, key checks and conditionals', () => {
    const conditional = { if: string, then: string }
    const node = ast.factory.createSchema({ type: 'object', properties, min: 1, max: 3, propertyNames: string, conditionals: [conditional] })

    expect(getChecks(node)).toStrictEqual([
      { kind: 'minProperties', value: 1 },
      { kind: 'maxProperties', value: 3 },
      { kind: 'propertyNames', schema: string },
      { kind: 'conditional', ...conditional },
    ])
  })

  test('leaves the key check of a plain record to the record', () => {
    expect(getChecks(ast.factory.createSchema({ type: 'object', properties: [], additionalProperties: string, propertyNames: string }))).toStrictEqual([])
  })

  test('checks pattern keys of a closed object with properties', () => {
    const patternProperties = { '^x-': string }
    const node = ast.factory.createSchema({ type: 'object', properties, patternProperties, additionalProperties: false })

    expect(getChecks(node)).toStrictEqual([{ kind: 'patternProperties', patterns: patternProperties }])
  })
})

describe('getObjectKind', () => {
  const object = ast.factory.createSchema({ type: 'object', properties })

  test.each([
    ['an object with properties', object, 'properties'],
    ['an empty object', ast.factory.createSchema({ type: 'object', properties: [] }), 'properties'],
    ['a record', ast.factory.createSchema({ type: 'object', properties: [], additionalProperties: string }), 'record'],
    ['properties plus a typed rest', ast.factory.createSchema({ type: 'object', properties, additionalProperties: string }), 'mixed'],
    ['an allOf of objects', ast.factory.createSchema({ type: 'intersection', members: [object, object] }), 'composed'],
    ['a single-member union', ast.factory.createSchema({ type: 'union', members: [object] }), 'properties'],
    ['an unresolved ref', ast.factory.createSchema({ type: 'ref', name: 'Pet' }), 'properties'],
    ['a resolved ref', ast.factory.createSchema({ type: 'ref', name: 'Pet', schema: object }), 'properties'],
    ['a nullable object', ast.factory.createSchema({ type: 'object', properties, nullable: true }), null],
    ['an object with a property count', ast.factory.createSchema({ type: 'object', properties, min: 1 }), null],
    [
      'an allOf with a record base',
      ast.factory.createSchema({
        type: 'intersection',
        members: [ast.factory.createSchema({ type: 'object', properties: [], additionalProperties: string }), object],
      }),
      null,
    ],
    ['a string', string, null],
  ] as const)('%s gives %s', (_, node, expected) => {
    expect(getObjectKind(node)).toBe(expected)
  })

  test('follows a chain of refs to its target', () => {
    const record = ast.factory.createSchema({ type: 'object', properties: [], additionalProperties: string })
    const inner = ast.factory.createSchema({ type: 'ref', name: 'Inner', schema: record })

    expect(getObjectKind(ast.factory.createSchema({ type: 'ref', name: 'Outer', schema: inner }))).toBe('record')
    expect(
      getObjectKind(ast.factory.createSchema({ type: 'ref', name: 'Outer', schema: ast.factory.createSchema({ type: 'ref', name: 'Name', schema: string }) })),
    ).toBeNull()
  })

  test('ends on a self-referencing allOf without circularSchemas', () => {
    const node = ast.factory.createSchema({ type: 'intersection', name: 'Tree', members: [] })
    Object.assign(node, { members: [ast.factory.createSchema({ type: 'ref', name: 'Tree', schema: node }), object] })

    expect(getObjectKind(node)).toBeNull()
  })

  test('gives null for a ref into a cycle', () => {
    expect(getObjectKind(ast.factory.createSchema({ type: 'ref', name: 'Tree', schema: object }), { circularSchemas: new Set(['Tree']) })).toBeNull()
  })
})

describe('isComposedObject', () => {
  const object = ast.factory.createSchema({
    type: 'object',
    properties: [ast.factory.createProperty({ name: 'id', schema: ast.factory.createSchema({ type: 'string' }), required: true })],
  })

  test('keeps a nullable or optional allOf composed', () => {
    expect(isComposedObject(ast.factory.createSchema({ type: 'intersection', members: [object, object] }))).toBe(true)
    expect(isComposedObject(ast.factory.createSchema({ type: 'intersection', nullable: true, members: [object, object] }))).toBe(true)
    expect(isComposedObject(ast.factory.createSchema({ type: 'intersection', optional: true, members: [object, object] }))).toBe(true)
    expect(getObjectKind(ast.factory.createSchema({ type: 'intersection', nullable: true, members: [object, object] }))).toBeNull()
  })

  test('is false for a schema that is not an allOf', () => {
    expect(isComposedObject(object)).toBe(false)
  })
})
