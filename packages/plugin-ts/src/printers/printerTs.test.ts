import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { format } from '#mocks'
import { resolverTs } from '../resolvers/resolverTs.ts'
import { print, type TsNode } from '../factory.ts'
import { printerTs } from './printerTs.ts'

const inlineLiteralEnum = { type: 'inlineLiteral', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' } as const
const enumEnum = { type: 'enum', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' } as const
const asConstEnum = { type: 'asConst', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' } as const
const literalEnum = { type: 'literal', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' } as const
const constEnumEnum = { type: 'constEnum', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' } as const

/**
 * Wraps a printed type in `type _ = <type>` so prettier can parse it as a
 * valid TypeScript statement, then strips the wrapper from the result.
 */
const formatTS = async (type: TsNode | string | null | undefined): Promise<string> => {
  if (!type) return ''

  const formatted = await format(`type _ = ${typeof type === 'string' ? type : print(type)}`)

  return formatted
    .replace(/^type _ = /, '')
    .replace(/;\s*$/, '')
    .trim()
}

describe('printerTs', () => {
  const printer = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: inlineLiteralEnum })

  it.each([
    ['any', 'any'],
    ['unknown', 'unknown'],
    ['void', 'void'],
    ['boolean', 'boolean'],
    ['null', 'null'],
    ['string', 'string'],
    ['uuid', 'string'],
    ['email', 'string'],
    ['url', 'string'],
    ['datetime', 'string'],
    ['number', 'number'],
    ['integer', 'number'],
    ['bigint', 'bigint'],
    ['blob', 'Blob'],
  ] as const)('scalar type %s', async (type, expected) => {
    expect(await formatTS(printer.transform(ast.factory.createSchema({ type })))).toBe(expected)
  })

  describe('date / time', () => {
    it('date with representation=date returns Date', async () => {
      const result = printer.transform(ast.factory.createSchema({ type: 'date', representation: 'date' }))

      expect(await formatTS(result)).toBe('Date')
    })

    it('date without date representation returns string', async () => {
      const result = printer.transform(ast.factory.createSchema({ type: 'date', representation: 'string' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('time with representation=date returns Date', async () => {
      const result = printer.transform(ast.factory.createSchema({ type: 'time', representation: 'date' }))

      expect(await formatTS(result)).toBe('Date')
    })

    it('time without date representation returns string', async () => {
      const result = printer.transform(ast.factory.createSchema({ type: 'time', representation: 'string' }))

      expect(await formatTS(result)).toBe('string')
    })
  })

  describe('ref', () => {
    it('ref with name returns type reference', async () => {
      const result = printer.transform(ast.factory.createSchema({ type: 'ref', name: 'MyType' }))

      expect(await formatTS(result)).toBe('MyType')
    })

    it('ref with $ref path uses canonical name from path, not node.name (Bug 1: allOf name override)', async () => {
      // When allOf flatten overrides node.name to the property name ("content"),
      // the printer should still resolve to the $ref target name ("TestContent").
      const result = printer.transform(ast.factory.createSchema({ type: 'ref', name: 'content', ref: '#/components/schemas/TestContent' }))

      expect(await formatTS(result)).toBe('TestContent')
    })

    it('ref with $ref path resolves discriminator child to parent (Bug 2: circular discriminator)', async () => {
      // ClientDisconnectedProblem allOf $ref -> Problem. The node.name is overridden
      // to "ClientDisconnectedProblem" by the flatten, but the ref points to Problem.
      const result = printer.transform(ast.factory.createSchema({ type: 'ref', name: 'ClientDisconnectedProblem', ref: '#/components/schemas/Problem' }))

      expect(await formatTS(result)).toBe('Problem')
    })

    it('ref without $ref path (inline ref) uses node.name directly', async () => {
      // Inline refs from resolver.imports/utils don't carry a $ref path — node.name is the resolved type.
      const result = printer.transform(ast.factory.createSchema({ type: 'ref', name: 'ResolvedType' }))

      expect(await formatTS(result)).toBe('ResolvedType')
    })

    it('ref with $ref path falls back to node.name when path segment missing', async () => {
      // Defensive: if $ref path has no segments, fall back to node.name
      const result = printer.transform(ast.factory.createSchema({ type: 'ref', name: 'FallbackType', ref: '' }))

      expect(await formatTS(result)).toBe('FallbackType')
    })

    it('ref resolves a collided component to its renamed name via targetName', async () => {
      // When `#/components/schemas/Order` collides with `#/components/requestBodies/Order`,
      // the adapter renames it to `OrderSchema` and stamps the ref; the printer must emit the
      // renamed type.
      const result = printer.transform(ast.factory.createSchema({ type: 'ref', name: 'Order', ref: '#/components/schemas/Order', targetName: 'OrderSchema' }))

      expect(await formatTS(result)).toBe('OrderSchema')
    })
  })

  describe('enum', () => {
    it('inlineLiteral (default) renders literal union', async () => {
      const result = printer.transform(ast.factory.createSchema({ type: 'enum', enumValues: ['a', 'b', 'c'] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'a' | 'b' | 'c'"`)
    })

    it('inlineLiteral with mixed types', async () => {
      const result = printer.transform(ast.factory.createSchema({ type: 'enum', enumValues: ['x', 1, true] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'x' | 1 | true"`)
    })

    it('enum without name still renders inline literal even when enumType is not inlineLiteral', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: enumEnum })
      const result = p.transform(ast.factory.createSchema({ type: 'enum', enumValues: ['a', 'b'] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'a' | 'b'"`)
    })

    it('enum with name and enumType=enum renders reference', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: enumEnum })
      const result = p.transform(ast.factory.createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('Status')
    })

    it('enum with name and enumType=asConst renders reference with Key suffix', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: asConstEnum })
      const result = p.transform(ast.factory.createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('StatusKey')
    })

    it('enum with name and enumType=literal renders reference', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: literalEnum })
      const result = p.transform(ast.factory.createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('Status')
    })

    it('enum with name and enumType=constEnum renders reference without Key suffix', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: constEnumEnum })
      const result = p.transform(ast.factory.createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('Status')
    })

    it('namedEnumValues are used when provided', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'enum',
          namedEnumValues: [
            { name: 'Active', value: 'active', primitive: 'string' },
            { name: 'Inactive', value: 'inactive', primitive: 'string' },
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'active' | 'inactive'"`)
    })

    it('single-value enum (OAS 3.1 const) renders an inline literal even with a name and enumType=asConst', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: asConstEnum })
      const result = p.transform(ast.factory.createSchema({ type: 'enum', name: 'Status', primitive: 'string', enumValues: ['active'] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'active'"`)
    })

    it('single-value enum (OAS 3.1 const) renders an inline literal with enumType=enum', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: enumEnum })
      const result = p.transform(ast.factory.createSchema({ type: 'enum', name: 'Answer', primitive: 'number', enumValues: [42] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"42"`)
    })

    it('namedEnumValues take precedence over enumValues', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'enum',
          namedEnumValues: [{ name: 'Yes', value: 1, primitive: 'number' }],
          enumValues: ['ignored'],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"1"`)
    })
  })

  describe('union', () => {
    it('renders a union of members', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'union',
          members: [ast.factory.createSchema({ type: 'string' }), ast.factory.createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toBe('string | number')
    })

    it('renders nested union', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'union',
          members: [
            ast.factory.createSchema({ type: 'string' }),
            ast.factory.createSchema({ type: 'union', members: [ast.factory.createSchema({ type: 'number' }), ast.factory.createSchema({ type: 'boolean' })] }),
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"string | (number | boolean)"`)
    })

    it('renders string & {} when union has string literal and plain string', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'union',
          members: [ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['test'] }), ast.factory.createSchema({ type: 'email' })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'test' | (string & {})"`)
    })

    it('renders string & {} when union has const-derived string enum (primitive only) and plain string', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'union',
          members: [ast.factory.createSchema({ type: 'enum', primitive: 'string', enumValues: ['accepted'] }), ast.factory.createSchema({ type: 'string' })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'accepted' | (string & {})"`)
    })
  })

  describe('intersection', () => {
    it('renders an intersection of members', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'intersection',
          members: [
            ast.factory.createSchema({
              type: 'object',
              properties: [ast.factory.createProperty({ name: 'a', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
            }),
            ast.factory.createSchema({
              type: 'object',
              properties: [ast.factory.createProperty({ name: 'b', required: true, schema: ast.factory.createSchema({ type: 'number' }) })],
            }),
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          a: string
        } & {
          b: number
        }"
      `)
    })
  })

  describe('array', () => {
    it('arrayType=array renders T[]', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'array',
          items: [ast.factory.createSchema({ type: 'string' })],
        }),
      )

      expect(await formatTS(result)).toBe('string[]')
    })

    it('arrayType=generic renders Array<T>', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'generic', enum: inlineLiteralEnum })
      const result = p.transform(
        ast.factory.createSchema({
          type: 'array',
          items: [ast.factory.createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toBe('Array<number>')
    })

    it('renders array with multiple item types as union', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'array',
          items: [ast.factory.createSchema({ type: 'string' }), ast.factory.createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"(string | number)[]"`)
    })
  })

  describe('tuple', () => {
    it('renders a basic tuple', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'tuple',
          items: [ast.factory.createSchema({ type: 'string' }), ast.factory.createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toBe('[string, number]')
    })

    it('renders tuple with rest element', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'tuple',
          items: [ast.factory.createSchema({ type: 'string' })],
          rest: ast.factory.createSchema({ type: 'number' }),
        }),
      )

      expect(await formatTS(result)).toBe('[string, ...number[]]')
    })

    it('renders tuple with min — optional items after min', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'tuple',
          items: [ast.factory.createSchema({ type: 'string' }), ast.factory.createSchema({ type: 'number' }), ast.factory.createSchema({ type: 'boolean' })],
          min: 1,
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"[string, number?, boolean?]"`)
    })

    it('renders tuple with max — items truncated to max', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'tuple',
          items: [ast.factory.createSchema({ type: 'string' }), ast.factory.createSchema({ type: 'number' }), ast.factory.createSchema({ type: 'boolean' })],
          max: 2,
        }),
      )

      expect(await formatTS(result)).toBe('[string, number]')
    })

    it('renders tuple with max and rest — fills up to max with rest type', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'tuple',
          items: [ast.factory.createSchema({ type: 'string' })],
          rest: ast.factory.createSchema({ type: 'number' }),
          max: 3,
        }),
      )

      expect(await formatTS(result)).toBe('[string, number, number]')
    })
  })

  describe('object', () => {
    it('restricts an optional nested record to propertyNames enum keys', async () => {
      const node = ast.factory.createSchema({
        type: 'object',
        properties: [
          ast.factory.createProperty({
            name: 'keys',
            schema: ast.factory.createSchema({
              type: 'object',
              propertyNames: ast.factory.createSchema({ type: 'enum', enumValues: ['x', 'y'] }),
              additionalProperties: ast.factory.createSchema({ type: 'string' }),
            }),
          }),
        ],
      })

      expect(await formatTS(printer.print(node))).toBe("{\n  keys?: Partial<Record<'x' | 'y', string>>\n}")
    })

    it('preserves referenced key enums and nullable record values', async () => {
      const node = ast.factory.createSchema({
        type: 'object',
        propertyNames: ast.factory.createSchema({
          type: 'ref',
          name: 'Keys',
          ref: '#/components/schemas/Keys',
          schema: ast.factory.createSchema({ type: 'enum', enumValues: ['x', 'y'] }),
        }),
        additionalProperties: ast.factory.createSchema({ type: 'string', nullable: true }),
      })

      expect(await formatTS(printer.print(node))).toBe('Partial<Record<Keys, string | null>>')
    })

    it.each([true, undefined] as const)('uses unknown for unconstrained enum-keyed values (%s)', async (additionalProperties) => {
      const node = ast.factory.createSchema({
        type: 'object',
        propertyNames: ast.factory.createSchema({ type: 'enum', enumValues: ['x', 'y'] }),
        additionalProperties,
      })

      expect(await formatTS(printer.print(node))).toBe("Partial<Record<'x' | 'y', unknown>>")
    })

    it('does not add enum-keyed values when additional properties are forbidden', async () => {
      const node = ast.factory.createSchema({
        type: 'object',
        propertyNames: ast.factory.createSchema({ type: 'enum', enumValues: ['x', 'y'] }),
        additionalProperties: false,
      })

      expect(await formatTS(printer.print(node))).toBe('object')
    })

    it('empty object returns object keyword', async () => {
      const result = printer.transform(ast.factory.createSchema({ type: 'object' }))

      expect(await formatTS(result)).toBe('object')
    })

    it('renders object with properties', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [
            ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'number' }) }),
            ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          id: number
          name: string
        }"
      `)
    })

    it('optional property with optionalType=questionToken', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'tag', schema: ast.factory.createSchema({ type: 'string', optional: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          tag?: string
        }"
      `)
    })

    it('optional property with optionalType=undefined adds | undefined', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'undefined', arrayType: 'array', enum: inlineLiteralEnum })
      const result = p.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'tag', schema: ast.factory.createSchema({ type: 'string', optional: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          tag: string | undefined
        }"
      `)
    })

    it('optional property with optionalType=questionTokenAndUndefined adds both', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionTokenAndUndefined', arrayType: 'array', enum: inlineLiteralEnum })
      const result = p.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'tag', schema: ast.factory.createSchema({ type: 'string', optional: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          tag?: string | undefined
        }"
      `)
    })

    it('nullable property adds | null', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'value', required: true, schema: ast.factory.createSchema({ type: 'string', nullable: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          value: string | null
        }"
      `)
    })

    it('readonly property', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'number', readOnly: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          readonly id: number
        }"
      `)
    })

    it('additionalProperties=true adds index signature of unknown', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [],
          additionalProperties: true,
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          [key: string]: unknown
        }"
      `)
    })

    it('additionalProperties as SchemaNode adds typed index signature', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [],
          additionalProperties: ast.factory.createSchema({ type: 'string' }),
        }),
      )

      expect(await formatTS(result)).toBe(`{
  [key: string]: string
}`)
    })

    it('additionalProperties with existing properties uses unknown for index', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'number' }) })],
          additionalProperties: ast.factory.createSchema({ type: 'string' }),
        }),
      )

      expect(await formatTS(result)).toBe(`{
  id: number
  [key: string]: unknown
}`)
    })

    it('patternProperties adds index signature', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [],
          patternProperties: { '^S_': ast.factory.createSchema({ type: 'string' }) },
        }),
      )

      expect(await formatTS(result)).toBe(`{
  [key: string]: string
}`)
    })

    it('patternProperties with nullable adds | null to index type', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [],
          patternProperties: { '^S_': ast.factory.createSchema({ type: 'string', nullable: true }) },
        }),
      )

      expect(await formatTS(result)).toBe(`{
  [key: string]: string | null
}`)
    })

    it('multiple patternProperties union their value types in one index signature', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [],
          patternProperties: {
            '^S_': ast.factory.createSchema({ type: 'string' }),
            '^I_': ast.factory.createSchema({ type: 'number' }),
          },
        }),
      )

      expect(await formatTS(result)).toBe(`{
  [key: string]: string | number
}`)
    })

    it('multiple patternProperties with identical value types dedupe to one type', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [],
          patternProperties: {
            '^S_': ast.factory.createSchema({ type: 'string' }),
            '^T_': ast.factory.createSchema({ type: 'string' }),
          },
        }),
      )

      expect(await formatTS(result)).toBe(`{
  [key: string]: string
}`)
    })

    it('additionalProperties and patternProperties merge into a single index signature', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [],
          additionalProperties: ast.factory.createSchema({ type: 'number' }),
          patternProperties: { '^S_': ast.factory.createSchema({ type: 'string' }) },
        }),
      )

      expect(await formatTS(result)).toBe(`{
  [key: string]: number | string
}`)
    })

    it('patternProperties with fixed properties uses unknown for the index type', async () => {
      const result = printer.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'number' }) })],
          patternProperties: { '^S_': ast.factory.createSchema({ type: 'string' }) },
        }),
      )

      expect(await formatTS(result)).toBe(`{
  id: number
  [key: string]: unknown
}`)
    })

    it('nullish property with optionalType=undefined adds | undefined', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'undefined', arrayType: 'array', enum: inlineLiteralEnum })
      const result = p.transform(
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'tag', schema: ast.factory.createSchema({ type: 'string', nullish: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          tag: string | undefined
        }"
      `)
    })
  })

  describe('print', () => {
    it('without typeName returns raw type string', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: inlineLiteralEnum })
      const result = p.print(ast.factory.createSchema({ type: 'string' }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "string
        "
      `)
    })

    it('with typeName wraps in export type declaration', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: inlineLiteralEnum, name: 'MyType' })
      const result = p.print(ast.factory.createSchema({ type: 'string' }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type MyType = string
        "
      `)
    })

    it('with typeName and object uses interface syntax by default', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: inlineLiteralEnum, name: 'MyObject' })
      const result = p.print(
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'id', schema: ast.factory.createSchema({ type: 'number' }) })],
        }),
      )

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type MyObject = {
          id?: number
        }
        "
      `)
    })

    it('with syntaxType=type forces type alias even for objects', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        name: 'MyObject',
        syntaxType: 'type',
      })
      const result = p.print(
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'id', schema: ast.factory.createSchema({ type: 'number' }) })],
        }),
      )

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type MyObject = {
          id?: number
        }
        "
      `)
    })

    it('nullable node adds | null to the declaration', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enum: inlineLiteralEnum, name: 'Status' })
      const result = p.print(ast.factory.createSchema({ type: 'string', nullable: true }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type Status = string | null
        "
      `)
    })

    it('optional node with optionalType=undefined adds | undefined to the declaration', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'undefined',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        name: 'MaybeValue',
      })
      const result = p.print(ast.factory.createSchema({ type: 'string', optional: true }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type MaybeValue = string | undefined
        "
      `)
    })

    it('with description adds @description JSDoc to the declaration', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        name: 'Described',
        description: 'A well-described type',
      })
      const result = p.print(ast.factory.createSchema({ type: 'string' }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "/**
         * @description A well-described type
         * @type string
         */
        export type Described = string
        "
      `)
    })

    it('with a multi-line description keeps each line in the JSDoc', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        name: 'Described',
        description: 'Provides:\n- `user_permissions`, e.g. ["write"]\n@example is text, not a tag',
      })
      const result = p.print(ast.factory.createSchema({ type: 'string' }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "/**
         * @description Provides:
         * - \`user_permissions\`, e.g. ["write"]
         * \\@example is text, not a tag
         * @type string
         */
        export type Described = string
        "
      `)
    })

    it('with keysToOmit wraps in Omit<Type, Keys>', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        name: 'Partial',
        keysToOmit: ['id', 'createdAt'],
      })
      const result = p.print(
        ast.factory.createSchema({
          type: 'object',
          properties: [
            ast.factory.createProperty({ name: 'id', schema: ast.factory.createSchema({ type: 'number' }) }),
            ast.factory.createProperty({ name: 'name', schema: ast.factory.createSchema({ type: 'string' }) }),
            ast.factory.createProperty({ name: 'createdAt', schema: ast.factory.createSchema({ type: 'string' }) }),
          ],
        }),
      )

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type Partial = Omit<
          NonNullable<{
            id?: number
            name?: string
            createdAt?: string
          }>,
          'id' | 'createdAt'
        >
        "
      `)
    })

    it('with keysToOmit and optional ref appends | undefined after Omit', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        name: 'AddFiles200',
        keysToOmit: ['name'],
      })
      const result = p.print(ast.factory.createSchema({ type: 'ref', name: 'Pet', optional: true }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type AddFiles200 = Omit<NonNullable<Pet>, 'name'> | undefined
        "
      `)
    })

    it('with keysToOmit and nullable ref appends | null after Omit', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        name: 'AddFiles200',
        keysToOmit: ['name'],
      })
      const result = p.print(ast.factory.createSchema({ type: 'ref', name: 'Pet', nullable: true }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type AddFiles200 = Omit<NonNullable<Pet>, 'name'> | null
        "
      `)
    })

    it('named optional ref always adds | undefined regardless of optionalType', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        name: 'AddFilesMutationRequest',
      })
      const result = p.print(ast.factory.createSchema({ type: 'ref', name: 'Pet', optional: true }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type AddFilesMutationRequest = Pet | undefined
        "
      `)
    })
  })

  describe('nodes override', () => {
    it('overrides a single node type', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        nodes: { date: () => 'string' },
      })
      expect(await formatTS(p.transform(ast.factory.createSchema({ type: 'date', representation: 'string' })))).toBe('string')
    })

    it('override does not affect other node types', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        nodes: { date: () => 'string' },
      })
      expect(await formatTS(p.transform(ast.factory.createSchema({ type: 'number' })))).toBe('number')
    })

    it('override can call this.transform for nested nodes', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        nodes: {
          array(node) {
            const itemNodes = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean)
            return `Set<${itemNodes.join(' | ')}>`
          },
        },
      })
      const node = ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] })
      expect(await formatTS(p.transform(node))).toBe('Set<string>')
    })

    it('override can read this.options', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enum: inlineLiteralEnum,
        syntaxType: 'type',
        nodes: {
          string() {
            return this.options.syntaxType === 'interface' ? 'never' : 'string'
          },
        },
      })
      expect(await formatTS(p.transform(ast.factory.createSchema({ type: 'string' })))).toBe('string')
    })
  })
})
