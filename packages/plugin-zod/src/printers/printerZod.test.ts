import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import z from 'zod'
import type { ResolverZod } from '../types.ts'
import { printerZod } from './printerZod.ts'

describe('printerZod', () => {
  const printer = printerZod({})

  test.each([
    ['any', 'z.any()'],
    ['unknown', 'z.unknown()'],
    ['void', 'z.void()'],
    ['boolean', 'z.boolean()'],
    ['null', 'z.null()'],
  ] as const)('scalar type %s', (type, expected) => {
    expect(printer.print(ast.factory.createSchema({ type }))).toBe(expected)
  })

  describe('string', () => {
    test('basic string', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'string' }))).toBe('z.string()')
    })

    test('string with coercion', () => {
      const p = printerZod({ coercion: { strings: true } })
      expect(p.print(ast.factory.createSchema({ type: 'string' }))).toBe('z.coerce.string()')
    })

    test('string with pattern', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'string', pattern: '^\\d+$' }))).toBe('z.string().regex(/^\\d+$/)')
    })

    test('string with min, max, and pattern', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'string', min: 1, max: 10, pattern: '^[a-z]+$' }))).toBe(
        'z.string().min(1).max(10).regex(/^[a-z]+$/)',
      )
    })

    test('string with pattern and regexType constructor', () => {
      const p = printerZod({ regexType: 'constructor' })
      expect(p.print(ast.factory.createSchema({ type: 'string', pattern: '^\\d+$' }))).toBe('z.string().regex(new RegExp("^\\\\d+$"))')
    })

    test('string with pattern and regexType literal', () => {
      const p = printerZod({ regexType: 'literal' })
      expect(p.print(ast.factory.createSchema({ type: 'string', pattern: '^\\d+$' }))).toBe('z.string().regex(/^\\d+$/)')
    })

    test('string with format int64 validates digits', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'string', format: 'int64' }))).toBe('z.string().regex(/^-?\\d+$/)')
    })

    test('string with format uint64 rejects a sign', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'string', format: 'uint64' }))).toBe('z.string().regex(/^\\d+$/)')
    })

    test('a pattern from the spec wins over the int64 fallback', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'string', format: 'int64', pattern: '^[0-9]{4}$' }))).toBe('z.string().regex(/^[0-9]{4}$/)')
    })

    test('string with a non-integer format stays unvalidated', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'string', format: 'double' }))).toBe('z.string()')
    })
  })

  describe('number', () => {
    test('basic number', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'number' }))).toBe('z.number()')
    })

    test('number with coercion', () => {
      const p = printerZod({ coercion: { numbers: true } })
      expect(p.print(ast.factory.createSchema({ type: 'number' }))).toBe('z.coerce.number()')
    })

    test('number with multipleOf', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'number', multipleOf: 5 }))).toBe('z.number().multipleOf(5)')
    })

    test('integer with min, max, and multipleOf', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'integer', min: 0, max: 100, multipleOf: 10 }))).toBe('z.int().min(0).max(100).multipleOf(10)')
    })
  })

  describe('integer', () => {
    test('basic integer', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'integer' }))).toBe('z.int()')
    })

    test('integer with coercion', () => {
      const p = printerZod({ coercion: { numbers: true } })
      expect(p.print(ast.factory.createSchema({ type: 'integer' }))).toBe('z.coerce.number().int()')
    })

    test('integer with int32 format', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'integer', format: 'int32' }))).toBe('z.int32()')
    })

    test('integer with uint32 format', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'integer', format: 'uint32' }))).toBe('z.uint32()')
    })

    test('integer with int32 format and constraints', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'integer', format: 'int32', min: 0, max: 100 }))).toBe('z.int32().min(0).max(100)')
    })

    test('integer with int32 format respects coercion over native helper', () => {
      const p = printerZod({ coercion: { numbers: true } })
      expect(p.print(ast.factory.createSchema({ type: 'integer', format: 'int32' }))).toBe('z.coerce.number().int()')
    })
  })

  describe('bigint', () => {
    test('basic bigint coerces, since JSON.parse yields a number', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'bigint' }))).toBe('z.coerce.bigint()')
    })
  })

  describe('date types', () => {
    test('date (JS Date) — output decodes string → Date (date-time default)', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'date', representation: 'date' }))).toBe('z.iso.datetime().transform((value) => new Date(value))')
    })

    test('date (JS Date), format date — output decodes string → Date', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'date', representation: 'date', format: 'date' }))).toBe(
        'z.iso.date().transform((value) => new Date(value))',
      )
    })

    test('date (JS Date) — input encodes Date → ISO string', () => {
      const p = printerZod({ direction: 'encode' })
      expect(p.print(ast.factory.createSchema({ type: 'date', representation: 'date', format: 'date-time' }))).toBe(
        'z.date().transform((value) => value.toISOString())',
      )
    })

    test('date (JS Date), format date — input encodes Date → YYYY-MM-DD string', () => {
      const p = printerZod({ direction: 'encode' })
      expect(p.print(ast.factory.createSchema({ type: 'date', representation: 'date', format: 'date' }))).toBe(
        'z.date().transform((value) => value.toISOString().slice(0, 10))',
      )
    })

    test('date (ISO string)', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'date', representation: 'string' }))).toBe('z.iso.date()')
    })

    test('datetime', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'datetime' }))).toBe('z.iso.datetime()')
    })

    test('datetime with dateType stringOffset option', () => {
      const p = printerZod({ dateType: 'stringOffset' })
      expect(p.print(ast.factory.createSchema({ type: 'datetime' }))).toBe('z.iso.datetime({ offset: true })')
    })

    test('datetime with dateType stringLocal option', () => {
      const p = printerZod({ dateType: 'stringLocal' })
      expect(p.print(ast.factory.createSchema({ type: 'datetime' }))).toBe('z.iso.datetime({ local: true })')
    })

    test('datetime with node.offset takes precedence', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'datetime', offset: true }))).toBe('z.iso.datetime({ offset: true })')
    })

    test('time (ISO string)', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'time', representation: 'string' }))).toBe('z.iso.time()')
    })

    test('time (JS Date) — output decodes HH:mm:ss string → Date on 1970-01-01 UTC', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'time', representation: 'date' }))).toBe(
        'z.iso.time().transform((value) => new Date(`1970-01-01T${value}Z`))',
      )
    })

    test('time (JS Date) — input encodes Date → HH:mm:ss string', () => {
      const p = printerZod({ direction: 'encode' })
      expect(p.print(ast.factory.createSchema({ type: 'time', representation: 'date' }))).toBe(
        'z.date().transform((value) => value.toISOString().slice(11, 19))',
      )
    })

    test('time (JS Date) — coercion.dates keeps the decode transform, since z.coerce.date() cannot parse HH:mm:ss', () => {
      const p = printerZod({ coercion: { dates: true } })
      expect(p.print(ast.factory.createSchema({ type: 'time', representation: 'date' }))).toBe(
        'z.iso.time().transform((value) => new Date(`1970-01-01T${value}Z`))',
      )
    })
  })

  describe('special string formats', () => {
    test.each([
      [{ type: 'uuid' }, 'z.uuid()'],
      [{ type: 'email' }, 'z.email()'],
      [{ type: 'url' }, 'z.url()'],
      [{ type: 'ipv4' }, 'z.ipv4()'],
      [{ type: 'ipv6' }, 'z.ipv6()'],
      [{ type: 'string', format: 'byte' }, 'z.base64()'],
      [{ type: 'string', format: 'base64' }, 'z.base64()'],
      [{ type: 'string', format: 'base64url' }, 'z.base64url()'],
      [{ type: 'string', format: 'jwt' }, 'z.jwt()'],
      [{ type: 'string', format: 'ulid' }, 'z.ulid()'],
      [{ type: 'string', format: 'iban' }, 'z.iban()'],
      [{ type: 'string', format: 'duration' }, 'z.iso.duration()'],
      [{ type: 'string', format: 'hostname' }, 'z.hostname()'],
    ] as const)('format %j', (schema, expected) => {
      expect(printer.print(ast.factory.createSchema(schema))).toBe(expected)
    })

    test('guid', () => {
      const p = printerZod({ guidType: 'guid' })
      expect(p.print(ast.factory.createSchema({ type: 'uuid' }))).toBe('z.guid()')
    })

    test('format helpers with constraints and coercion', () => {
      expect(printer.print(ast.factory.createSchema({ type: 'string', format: 'base64', min: 10 }))).toBe('z.base64().min(10)')
      const p = printerZod({ coercion: { strings: true } })
      expect(p.print(ast.factory.createSchema({ type: 'string', format: 'base64' }))).toBe('z.coerce.string()')
    })
  })

  describe('enum', () => {
    test('string enum', () => {
      const result = printer.print(ast.factory.createSchema({ type: 'enum', enumValues: ['a', 'b', 'c'] }))
      expect(result).toMatchInlineSnapshot(`"z.enum(['a', 'b', 'c'])"`)
    })

    test('number enum uses z.union of literals', () => {
      const result = printer.print(ast.factory.createSchema({ type: 'enum', enumValues: [200, 400, 500] }))
      expect(result).toBe('z.union([z.literal(200), z.literal(400), z.literal(500)])')
    })

    test('single number enum uses z.literal', () => {
      const result = printer.print(ast.factory.createSchema({ type: 'enum', enumValues: [42] }))
      expect(result).toBe('z.literal(42)')
    })

    test('boolean enum uses z.union of literals', () => {
      const result = printer.print(ast.factory.createSchema({ type: 'enum', enumValues: [true, false] }))
      expect(result).toBe('z.union([z.literal(true), z.literal(false)])')
    })

    test('mixed value enum uses z.union of literals', () => {
      const result = printer.print(ast.factory.createSchema({ type: 'enum', enumValues: ['active', 1, true] }))
      expect(result).toBe("z.union([z.literal('active'), z.literal(1), z.literal(true)])")
    })

    test('number literals (namedEnumValues)', () => {
      const result = printer.print(
        ast.factory.createSchema({
          type: 'enum',
          namedEnumValues: [
            { name: 'Ok', value: 200, primitive: 'number' },
            { name: 'BadRequest', value: 400, primitive: 'number' },
          ],
        }),
      )
      expect(result).toBe('z.union([z.literal(200), z.literal(400)])')
    })

    test('boolean literal (namedEnumValues)', () => {
      const result = printer.print(
        ast.factory.createSchema({
          type: 'enum',
          namedEnumValues: [{ name: 'Active', value: true, primitive: 'boolean' }],
        }),
      )
      expect(result).toBe('z.literal(true)')
    })
  })

  describe('object', () => {
    test('basic object', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
          ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
      })
      expect(printer.print(node)).toMatchInlineSnapshot(`
        "z.object({
          id: z.int(),
          name: z.string(),
        })"
      `)
    })

    test('object with additionalProperties: true → z.looseObject', () => {
      const node = ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [], additionalProperties: true })
      expect(printer.print(node)).toBe('z.looseObject({})')
    })

    test('object with additionalProperties: true and properties → z.looseObject', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) })],
        additionalProperties: true,
      })
      expect(printer.print(node)).toBe('z.looseObject({\n  id: z.int(),\n})')
    })

    test('object with additionalProperties: false → z.strictObject()', () => {
      const node = ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [], additionalProperties: false })
      expect(printer.print(node)).toBe('z.strictObject({})')
    })

    test('object with additionalProperties schema and no properties → z.record(z.string(), schema)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        additionalProperties: ast.factory.createSchema({ type: 'string' }),
      })
      expect(printer.print(node)).toBe('z.record(z.string(), z.string())')
    })

    test('object with additionalProperties schema and fixed properties → .catchall(schema)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) })],
        additionalProperties: ast.factory.createSchema({ type: 'string' }),
      })
      expect(printer.print(node)).toBe('z.object({\n  id: z.int(),\n}).catchall(z.string())')
    })

    test('object with propertyNames regex and additionalProperties → z.record(keySchema, schema)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        propertyNames: ast.factory.createSchema({ type: 'string', pattern: '^[a-z]+$' }),
        additionalProperties: ast.factory.createSchema({ type: 'integer' }),
      } as any)
      expect(printer.print(node)).toBe('z.record(z.string().regex(/^[a-z]+$/), z.int())')
    })

    test('object with propertyNames enum and additionalProperties → z.partialRecord(enumKeySchema, schema)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        propertyNames: ast.factory.createSchema({ type: 'enum', enumValues: ['admin', 'user'] }),
        additionalProperties: ast.factory.createSchema({ type: 'string' }),
      } as any)
      expect(printer.print(node)).toBe("z.partialRecord(z.enum(['admin', 'user']), z.string())")
    })

    test('generated partialRecord with enum keys allows partial key subsets at runtime', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        propertyNames: ast.factory.createSchema({ type: 'enum', enumValues: ['admin', 'user'] }),
        additionalProperties: ast.factory.createSchema({ type: 'string' }),
      } as any)
      const code = printer.print(node)
      const schema = new Function('z', `return ${code}`)(z)
      // Partial subset of keys is valid
      expect(schema.safeParse({ admin: 'Alice' }).success).toBe(true)
      // All keys valid
      expect(schema.safeParse({ admin: 'Alice', user: 'Bob' }).success).toBe(true)
      // Empty object valid
      expect(schema.safeParse({}).success).toBe(true)
      // Unrecognized key fails
      expect(schema.safeParse({ guest: 'Charlie' }).success).toBe(false)
    })

    test('object with propertyNames and additionalProperties: false → z.strictObject({})', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        propertyNames: ast.factory.createSchema({ type: 'string', pattern: '^[a-z]+$' }),
        additionalProperties: false,
      } as any)
      expect(printer.print(node)).toBe('z.strictObject({})')
    })

    test('object with propertyNames $ref to enum schema → z.partialRecord(RefName, schema)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        propertyNames: ast.factory.createSchema({
          type: 'ref',
          name: 'RoleEnum',
          ref: '#/components/schemas/RoleEnum',
          schema: ast.factory.createSchema({ type: 'enum', enumValues: ['admin', 'editor'] }),
        }),
        additionalProperties: ast.factory.createSchema({ type: 'string' }),
      } as any)
      expect(printer.print(node)).toBe('z.partialRecord(RoleEnum, z.string())')
    })

    test('object with propertyNames $ref key schema → z.record(RefName, schema)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        propertyNames: ast.factory.createSchema({
          type: 'ref',
          name: 'ErrorCode',
          ref: '#/components/schemas/ErrorCode',
        }),
        additionalProperties: ast.factory.createSchema({ type: 'string' }),
      } as any)
      expect(printer.print(node)).toBe('z.record(ErrorCode, z.string())')
    })

    test('object with nullable dictionary schema → z.record(...).nullable()', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        additionalProperties: ast.factory.createSchema({ type: 'string' }),
        nullable: true,
      })
      expect(printer.print(node)).toBe('z.record(z.string(), z.string()).nullable()')
    })

    test('object with propertyNames minLength and maxLength constraints → z.record(z.string().min(2).max(10), schema)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        propertyNames: ast.factory.createSchema({ type: 'string', min: 2, max: 10 }),
        additionalProperties: ast.factory.createSchema({ type: 'string' }),
      } as any)
      expect(printer.print(node)).toBe('z.record(z.string().min(2).max(10), z.string())')

      const code = printer.print(node)
      const schema = new Function('z', `return ${code}`)(z)
      expect(schema.safeParse({ ab: 'hello', abcdefghij: 'world' }).success).toBe(true)
      expect(schema.safeParse({ a: 'too short' }).success).toBe(false)
      expect(schema.safeParse({ abcdefghijk: 'too long' }).success).toBe(false)
    })

    test('object with propertyNames enum and nullable dictionary → z.partialRecord(...).nullable()', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        propertyNames: ast.factory.createSchema({ type: 'enum', enumValues: ['read', 'write'] }),
        additionalProperties: ast.factory.createSchema({ type: 'boolean' }),
        nullable: true,
      } as any)
      expect(printer.print(node)).toBe("z.partialRecord(z.enum(['read', 'write']), z.boolean()).nullable()")

      const code = printer.print(node)
      const schema = new Function('z', `return ${code}`)(z)
      expect(schema.safeParse(null).success).toBe(true)
      expect(schema.safeParse({ read: true }).success).toBe(true)
      expect(schema.safeParse({ other: true }).success).toBe(false)
    })

    test('object with patternProperties → z.record(regex key, value)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        patternProperties: { '^S_': ast.factory.createSchema({ type: 'string' }) },
      })
      expect(printer.print(node)).toBe('z.record(z.string().regex(/^S_/), z.string())')
    })

    test('object with nullable patternProperties value → record value gets .nullable()', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        patternProperties: { '^S_': ast.factory.createSchema({ type: 'string', nullable: true }) },
      })
      expect(printer.print(node)).toBe('z.record(z.string().regex(/^S_/), z.string().nullable())')
    })

    test('patternProperties with fixed properties → .catchall (record cannot coexist with a fixed shape)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) })],
        patternProperties: { '^meta_': ast.factory.createSchema({ type: 'string' }) },
      })
      expect(printer.print(node)).toBe('z.object({\n  id: z.int(),\n}).catchall(z.string())')
    })

    test('multiple patternProperties → alternation key regex with a union value', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        patternProperties: {
          '^S_': ast.factory.createSchema({ type: 'string' }),
          '^I_': ast.factory.createSchema({ type: 'integer' }),
        },
      })
      expect(printer.print(node)).toBe('z.record(z.string().regex(/(^S_)|(^I_)/), z.union([z.string(), z.int()]))')
    })

    test('multiple patternProperties with identical value types → single value, no union', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        patternProperties: {
          '^S_': ast.factory.createSchema({ type: 'string' }),
          '^T_': ast.factory.createSchema({ type: 'string' }),
        },
      })
      expect(printer.print(node)).toBe('z.record(z.string().regex(/(^S_)|(^T_)/), z.string())')
    })

    test('additionalProperties takes precedence over patternProperties', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        additionalProperties: ast.factory.createSchema({ type: 'number' }),
        patternProperties: { '^S_': ast.factory.createSchema({ type: 'string' }) },
      })
      expect(printer.print(node)).toBe('z.record(z.string(), z.number())')
    })

    test('additionalProperties:false with patternProperties keeps the pattern record (not .strict)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        additionalProperties: false,
        patternProperties: { '^S_': ast.factory.createSchema({ type: 'string' }) },
      })
      expect(printer.print(node)).toBe('z.record(z.string().regex(/^S_/), z.string())')
    })
  })

  describe('array', () => {
    test('basic array', () => {
      const node = ast.factory.createSchema({
        type: 'array',
        items: [ast.factory.createSchema({ type: 'string' })],
      })
      expect(printer.print(node)).toBe('z.array(z.string())')
    })
  })

  describe('ref', () => {
    test('cross-file ref returns bare name', () => {
      const node = ast.factory.createSchema({ type: 'ref', name: 'UnsupportedAuthenticationProblem', ref: '#/components/schemas/Problem' })

      expect(printer.print(node)).toBe('Problem')
    })

    test('cross-file ref with resolver returns resolved bare name', () => {
      const p = printerZod({
        resolver: { name: (name: string) => `${name.charAt(0).toLowerCase()}${name.slice(1)}Schema` } as unknown as ResolverZod,
      })
      const node = ast.factory.createSchema({ type: 'ref', name: 'UnsupportedAuthenticationProblem', ref: '#/components/schemas/Problem' })

      expect(p.print(node)).toBe('problemSchema')
    })

    test('ref without $ref path (intersection chaining) returns bare name', () => {
      const node = ast.factory.createSchema({ type: 'ref', name: 'PhoneNumber' })

      expect(printer.print(node)).toBe('PhoneNumber')
    })

    test('collided ref resolves to its renamed name via targetName', () => {
      const p = printerZod({})
      const node = ast.factory.createSchema({ type: 'ref', name: 'Order', ref: '#/components/schemas/Order', targetName: 'OrderSchema' })

      expect(p.print(node)).toBe('OrderSchema')
    })

    test('self-ref wraps in z.lazy()', () => {
      const p = printerZod({ cyclicSchemas: new Set(['TreeNode']) })
      const node = ast.factory.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' })

      expect(p.print(node)).toBe('z.lazy(() => TreeNode)')
    })

    test('object cross-file ref property uses bare name (no getter)', () => {
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.factory.createProperty({
            name: 'category',
            required: false,
            schema: ast.factory.createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }),
          }),
          ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
      })

      expect(printer.print(node)).toMatchInlineSnapshot(`
        "z.object({
          category: Category.optional(),
          name: z.string(),
        })"
      `)
    })

    test('object self-ref property uses getter with bare name', () => {
      const p = printerZod({ cyclicSchemas: new Set(['TreeNode']) })
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.factory.createProperty({
            name: 'children',
            required: false,
            schema: ast.factory.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }),
          }),
          ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
      })

      expect(p.print(node)).toMatchInlineSnapshot(`
        "z.object({
          get children() { return TreeNode.optional() },
          name: z.string(),
        })"
      `)
    })

    test('strict object with a self-ref property stays loadable (z.strictObject, not .strict())', () => {
      // `.strict()` reads `.shape` eagerly, so it would run the getter while `TreeNode`'s own
      // `const` is still in the temporal dead zone and the generated module would throw on import
      // with "Cannot access 'TreeNode' before initialization".
      const p = printerZod({ cyclicSchemas: new Set(['TreeNode']) })
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        additionalProperties: false,
        properties: [
          ast.factory.createProperty({
            name: 'children',
            required: false,
            schema: ast.factory.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }),
          }),
          ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
      })

      expect(p.print(node)).toMatchInlineSnapshot(`
        "z.strictObject({
          get children() { return TreeNode.optional() },
          name: z.string(),
        })"
      `)
    })

    test('object indirect-cycle property uses getter with bare schema name (no double z.lazy)', () => {
      // Cat → Pet → Cat: Cat is not self-referencing but Pet is cyclic, so archEnemy should be a getter
      const p = printerZod({ cyclicSchemas: new Set(['Cat', 'Pet']) })
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.factory.createProperty({
            name: 'archEnemy',
            required: false,
            schema: ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }),
          }),
          ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
      })

      // z.lazy() should be stripped inside getter (getter already defers evaluation)
      expect(p.print(node)).toMatchInlineSnapshot(`
        "z.object({
          get archEnemy() { return Pet.optional() },
          name: z.string(),
        })"
      `)
    })
  })

  describe('intersection', () => {
    test('ref with string maxLength constraint', () => {
      const node = ast.factory.createSchema({
        type: 'intersection',
        members: [ast.factory.createSchema({ type: 'ref', name: 'PhoneNumber' }), ast.factory.createSchema({ type: 'string', max: 15 })],
      })
      expect(printer.print(node)).toBe('PhoneNumber.max(15)')
    })

    test('ref with string min and max constraints', () => {
      const node = ast.factory.createSchema({
        type: 'intersection',
        members: [ast.factory.createSchema({ type: 'ref', name: 'PhoneNumber' }), ast.factory.createSchema({ type: 'string', min: 10, max: 15 })],
      })
      expect(printer.print(node)).toBe('PhoneNumber.min(10).max(15)')
    })

    test('ref with string pattern constraint', () => {
      const node = ast.factory.createSchema({
        type: 'intersection',
        members: [ast.factory.createSchema({ type: 'ref', name: 'Token' }), ast.factory.createSchema({ type: 'string', pattern: '^[A-Z]+$' })],
      })
      expect(printer.print(node)).toBe('Token.regex(/^[A-Z]+$/)')
    })

    test('ref with number min/max constraints', () => {
      const node = ast.factory.createSchema({
        type: 'intersection',
        members: [ast.factory.createSchema({ type: 'ref', name: 'Score' }), ast.factory.createSchema({ type: 'number', min: 0, max: 100 })],
      })
      expect(printer.print(node)).toBe('Score.min(0).max(100)')
    })

    test('two complex members fall back to .and()', () => {
      const node = ast.factory.createSchema({
        type: 'intersection',
        members: [ast.factory.createSchema({ type: 'string' }), ast.factory.createSchema({ type: 'number' })],
      })
      expect(printer.print(node)).toBe('z.string().and(z.number())')
    })

    test('single member', () => {
      const node = ast.factory.createSchema({
        type: 'intersection',
        members: [ast.factory.createSchema({ type: 'string' })],
      })
      expect(printer.print(node)).toBe('z.string()')
    })

    test('intersection with propertyNames member falls back to .and() instead of .extend()', () => {
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
      expect(printer.print(node)).toBe(`z.object({
  id: z.string(),
}).and(z.record(z.string().regex(/^[a-z]+$/), z.unknown()))`)
    })
  })

  describe('union', () => {
    test('basic union', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        members: [ast.factory.createSchema({ type: 'string' }), ast.factory.createSchema({ type: 'number' })],
      })
      expect(printer.print(node)).toBe('z.union([z.string(), z.number()])')
    })

    test('oneOf union', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        strategy: 'one',
        members: [
          ast.factory.createSchema({ type: 'ref', name: 'TypeA', ref: '#/components/schemas/TypeA' }),
          ast.factory.createSchema({ type: 'ref', name: 'TypeB', ref: '#/components/schemas/TypeB' }),
        ],
      })
      expect(printer.print(node)).toBe('z.union([TypeA, TypeB])')
    })

    describe("oneOfType: 'xor'", () => {
      const xorPrinter = printerZod({ oneOfType: 'xor' })
      const contactBy = (key: string, required = true) =>
        ast.factory.createSchema({
          type: 'object',
          primitive: 'object',
          properties: [ast.factory.createProperty({ name: key, required, schema: ast.factory.createSchema({ type: 'string' }) })],
        })
      const contact = ast.factory.createSchema({ type: 'union', strategy: 'one', members: [contactBy('email'), contactBy('phone')] })
      const load = (code: string | null | undefined) => new Function('z', `return ${code}`)(z) as z.ZodType

      test('prints z.xor with members as declared', () => {
        expect(xorPrinter.print(contact)).toMatchInlineSnapshot(`
          "z.xor([
            z.object({
              email: z.string(),
            }),
            z.object({
              phone: z.string(),
            }),
          ])"
        `)
      })

      test('passes only when exactly one member matches, extra keys included', () => {
        const schema = load(xorPrinter.print(contact))

        expect(schema.safeParse({ email: 'ann@example.com' }).success).toBe(true)
        expect(schema.safeParse({ email: 'ann@example.com', name: 'Ann' }).success).toBe(true)
        expect(schema.safeParse({ email: 'ann@example.com', phone: '555-0100' }).success).toBe(false)
        expect(schema.safeParse({}).success).toBe(false)
      })

      test('rejects values that match every member when no key is required', () => {
        const node = ast.factory.createSchema({ type: 'union', strategy: 'one', members: [contactBy('email', false), contactBy('phone', false)] })
        const schema = load(xorPrinter.print(node))

        expect(schema.safeParse({}).success).toBe(false)
        expect(schema.safeParse({ email: 'ann@example.com' }).success).toBe(false)
      })

      test('does not append .strict() to ref members', () => {
        const node = ast.factory.createSchema({
          type: 'union',
          strategy: 'one',
          members: [
            ast.factory.createSchema({ type: 'ref', name: 'EmailContact', ref: '#/components/schemas/EmailContact', schema: contactBy('email') }),
            ast.factory.createSchema({ type: 'ref', name: 'PhoneContact', ref: '#/components/schemas/PhoneContact', schema: contactBy('phone') }),
          ],
        })

        expect(xorPrinter.print(node)).toBe('z.xor([EmailContact, PhoneContact])')
      })

      test('keeps z.discriminatedUnion with strict members for a discriminated oneOf', () => {
        const node = ast.factory.createSchema({
          type: 'union',
          strategy: 'one',
          discriminatorPropertyName: 'email',
          members: [contactBy('email'), contactBy('phone')],
        })
        const code = xorPrinter.print(node)

        expect(code).toMatch(/^z\.discriminatedUnion\('email', \[\s+z\.strictObject\(/)
      })

      test('keeps z.union for anyOf', () => {
        const node = ast.factory.createSchema({ type: 'union', strategy: 'any', members: [contactBy('email'), contactBy('phone')] })

        expect(xorPrinter.print(node)).toMatch(/^z\.union\(\[\s+z\.object\(/)
      })
    })

    test('oneOf union with a self-referential object member stays loadable', () => {
      // The member is strict because it is a `oneOf` variant, and it carries a deferred getter.
      // Appending `.strict()` here would read `.shape` eagerly and throw on import.
      const p = printerZod({ cyclicSchemas: new Set(['TreeNode']) })
      const node = ast.factory.createSchema({
        type: 'union',
        strategy: 'one',
        members: [
          ast.factory.createSchema({
            type: 'object',
            primitive: 'object',
            properties: [
              ast.factory.createProperty({
                name: 'children',
                required: false,
                schema: ast.factory.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }),
              }),
            ],
          }),
          ast.factory.createSchema({
            type: 'object',
            primitive: 'object',
            properties: [ast.factory.createProperty({ name: 'valueB', required: true, schema: ast.factory.createSchema({ type: 'number' }) })],
          }),
        ],
      })

      expect(p.print(node)).toMatchInlineSnapshot(`
        "z.union([
          z.strictObject({
            get children() { return TreeNode.optional() },
          }),
          z.strictObject({
            valueB: z.number(),
          }),
        ])"
      `)
    })

    test('oneOf union with object members uses strict objects', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        strategy: 'one',
        members: [
          ast.factory.createSchema({
            type: 'object',
            primitive: 'object',
            properties: [ast.factory.createProperty({ name: 'valueA', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
          }),
          ast.factory.createSchema({
            type: 'object',
            primitive: 'object',
            properties: [ast.factory.createProperty({ name: 'valueB', required: true, schema: ast.factory.createSchema({ type: 'number' }) })],
          }),
        ],
      })
      expect(printer.print(node)).toMatchInlineSnapshot(`
        "z.union([
          z.strictObject({
            valueA: z.string(),
          }),
          z.strictObject({
            valueB: z.number(),
          }),
        ])"
      `)
    })

    test('oneOf union with resolved object refs uses strict refs', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        strategy: 'one',
        members: [
          ast.factory.createSchema({
            type: 'ref',
            name: 'TypeA',
            ref: '#/components/schemas/TypeA',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
          }),
          ast.factory.createSchema({
            type: 'ref',
            name: 'TypeB',
            ref: '#/components/schemas/TypeB',
            schema: ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [] }),
          }),
        ],
      })
      expect(printer.print(node)).toBe('z.union([TypeA.strict(), TypeB.strict()])')
    })

    test('single member union', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        members: [ast.factory.createSchema({ type: 'string' })],
      })
      expect(printer.print(node)).toBe('z.string()')
    })

    test('discriminated union', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        discriminatorPropertyName: 'petType',
        members: [
          ast.factory.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
          ast.factory.createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }),
        ],
      })
      expect(printer.print(node)).toMatchInlineSnapshot(`"z.discriminatedUnion('petType', [Cat, Dog])"`)
    })

    test('discriminated union flattens allOf variants with .extend() so they discriminate', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        discriminatorPropertyName: 'type',
        members: [
          ast.factory.createSchema({
            type: 'intersection',
            members: [
              ast.factory.createSchema({ type: 'ref', name: 'Base', ref: '#/components/schemas/Base' }),
              ast.factory.createSchema({
                type: 'object',
                primitive: 'object',
                properties: [ast.factory.createProperty({ name: 'text', required: false, schema: ast.factory.createSchema({ type: 'string' }) })],
              }),
            ],
          }),
          ast.factory.createSchema({ type: 'ref', name: 'Other', ref: '#/components/schemas/Other' }),
        ],
      })
      // An object-composable allOf variant renders via `.extend(...)`, which stays a ZodObject, so the
      // whole union can use z.discriminatedUnion instead of a plain z.union.
      expect(printer.print(node)).toBe(`z.discriminatedUnion('type', [
  Base.extend({
    text: z.string().optional(),
  }),
  Other,
])`)
    })

    test('discriminated union with single member', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        discriminatorPropertyName: 'type',
        members: [ast.factory.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' })],
      })
      expect(printer.print(node)).toBe('Cat')
    })

    test('discriminated union with object members', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        discriminatorPropertyName: 'status',
        members: [
          ast.factory.createSchema({
            type: 'object',
            primitive: 'object',
            properties: [
              ast.factory.createProperty({ name: 'status', required: true, schema: ast.factory.createSchema({ type: 'enum', enumValues: ['active'] }) }),
              ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
            ],
          }),
          ast.factory.createSchema({
            type: 'object',
            primitive: 'object',
            properties: [
              ast.factory.createProperty({ name: 'status', required: true, schema: ast.factory.createSchema({ type: 'enum', enumValues: ['inactive'] }) }),
              ast.factory.createProperty({ name: 'reason', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
            ],
          }),
        ],
      })
      expect(printer.print(node)).toMatchInlineSnapshot(`
        "z.discriminatedUnion('status', [
          z.object({
            status: z.enum(['active']),
            name: z.string(),
          }),
          z.object({
            status: z.enum(['inactive']),
            reason: z.string(),
          }),
        ])"
      `)
    })

    test('falls back to z.union when a cyclic variant cannot flatten to an object', () => {
      const cyclicPrinter = printerZod({ cyclicSchemas: new Set(['BasePet']) })
      const node = ast.factory.createSchema({
        type: 'union',
        discriminatorPropertyName: 'petType',
        members: [
          ast.factory.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
          ast.factory.createSchema({
            type: 'intersection',
            members: [
              ast.factory.createSchema({ type: 'ref', name: 'BasePet', ref: '#/components/schemas/BasePet' }),
              ast.factory.createSchema({
                type: 'object',
                primitive: 'object',
                properties: [ast.factory.createProperty({ name: 'petType', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
              }),
            ],
          }),
        ],
      })
      // A cyclic ref renders as `z.lazy(...)`, which is not a ZodObject and cannot take `.extend(...)`,
      // so the variant stays a ZodIntersection and the union falls back to z.union.
      expect(cyclicPrinter.print(node)).toBe(`z.union([
  Cat,
  z.lazy(() => BasePet).and(z.object({
    petType: z.string(),
  })),
])`)
    })

    test('discriminated union with three or more ref members', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        discriminatorPropertyName: 'type',
        members: [
          ast.factory.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
          ast.factory.createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }),
          ast.factory.createSchema({ type: 'ref', name: 'Bird', ref: '#/components/schemas/Bird' }),
        ],
      })
      expect(printer.print(node)).toMatchInlineSnapshot(`"z.discriminatedUnion('type', [Cat, Dog, Bird])"`)
    })

    test('empty discriminated union returns empty string', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        discriminatorPropertyName: 'type',
        members: [],
      })
      expect(printer.print(node)).toBeNull()
    })

    test('falls back to z.union when a variant is a record (not a ZodObject)', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        discriminatorPropertyName: 'type',
        members: [
          ast.factory.createSchema({
            type: 'object',
            properties: [ast.factory.createProperty({ name: 'type', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
          }),
          ast.factory.createSchema({
            type: 'object',
            properties: [],
            additionalProperties: ast.factory.createSchema({ type: 'string' }),
          }),
        ],
      })
      expect(printer.print(node)).toBe(`z.union([
  z.object({
    type: z.string(),
  }),
  z.record(z.string(), z.string()),
])`)
    })

    test('discriminated union with looseObject variants emits z.discriminatedUnion and allows undeclared keys', () => {
      const node = ast.factory.createSchema({
        type: 'union',
        discriminatorPropertyName: 'type',
        members: [
          ast.factory.createSchema({
            type: 'object',
            properties: [
              ast.factory.createProperty({ name: 'type', required: true, schema: ast.factory.createSchema({ type: 'enum', enumValues: ['cat'] }) }),
              ast.factory.createProperty({ name: 'meow', required: true, schema: ast.factory.createSchema({ type: 'boolean' }) }),
            ],
            additionalProperties: true,
          }),
          ast.factory.createSchema({
            type: 'object',
            properties: [
              ast.factory.createProperty({ name: 'type', required: true, schema: ast.factory.createSchema({ type: 'enum', enumValues: ['dog'] }) }),
              ast.factory.createProperty({ name: 'bark', required: true, schema: ast.factory.createSchema({ type: 'boolean' }) }),
            ],
            additionalProperties: true,
          }),
        ],
      })
      expect(printer.print(node)).toBe(`z.discriminatedUnion('type', [
  z.looseObject({
    type: z.enum(['cat']),
    meow: z.boolean(),
  }),
  z.looseObject({
    type: z.enum(['dog']),
    bark: z.boolean(),
  }),
])`)

      const code = printer.print(node)
      const schema = new Function('z', `return ${code}`)(z)
      expect(schema.safeParse({ type: 'cat', meow: true, extraProperty: 123 }).success).toBe(true)
      expect(schema.safeParse({ type: 'unknown', meow: true }).success).toBe(false)
    })
  })

  describe('coercion', () => {
    test('granular coercion', () => {
      const p = printerZod({ coercion: { strings: true, numbers: false } })
      expect(p.print(ast.factory.createSchema({ type: 'string' }))).toBe('z.coerce.string()')
      expect(p.print(ast.factory.createSchema({ type: 'number' }))).toBe('z.number()')
    })
  })

  describe('keysToOmit', () => {
    test('omits single key from object schema', () => {
      const p = printerZod({ keysToOmit: ['id'] })
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
          ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
      })
      expect(p.print(node)).toMatchInlineSnapshot(`
        "z.object({
          id: z.int(),
          name: z.string(),
        }).omit({ "id": true })"
      `)
    })

    test('omits multiple keys from object schema', () => {
      const p = printerZod({ keysToOmit: ['id', 'createdAt'] })
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
          ast.factory.createProperty({ name: 'createdAt', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
          ast.factory.createProperty({ name: 'name', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
        ],
      })
      expect(p.print(node)).toMatchInlineSnapshot(`
        "z.object({
          id: z.int(),
          createdAt: z.string(),
          name: z.string(),
        }).omit({ "id": true, "createdAt": true })"
      `)
    })

    test('no omit when keysToOmit is empty', () => {
      const p = printerZod({ keysToOmit: [] })
      const node = ast.factory.createSchema({ type: 'string' })
      expect(p.print(node)).toBe('z.string()')
    })

    test('skips omit for discriminated union', () => {
      const p = printerZod({ keysToOmit: ['petType'] })
      const node = ast.factory.createSchema({
        type: 'union',
        primitive: 'object',
        discriminatorPropertyName: 'petType',
        members: [
          ast.factory.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
          ast.factory.createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }),
        ],
      })
      expect(p.print(node)).toMatchInlineSnapshot(`"z.discriminatedUnion('petType', [Cat, Dog])"`)
    })

    test('unwraps a nullable ref before omit so .omit() targets the ZodObject', () => {
      // https://github.com/kubb-labs/plugins/issues/567 (bug 4): a $ref to a nullable schema
      // resolves to a ZodNullable variable, and .omit() only exists on the inner ZodObject.
      const p = printerZod({ keysToOmit: ['pending'] })
      const node = ast.factory.createSchema({
        type: 'ref',
        name: 'maintenanceWindow',
        ref: '#/components/schemas/maintenance_window',
        nullable: true,
        primitive: 'object',
      })
      expect(p.print(node)).toBe('maintenance_window.unwrap().omit({ "pending": true }).nullable()')
    })

    test('does not unwrap an inline nullable object before omit', () => {
      const p = printerZod({ keysToOmit: ['pending'] })
      const node = ast.factory.createSchema({
        type: 'object',
        primitive: 'object',
        nullable: true,
        properties: [
          ast.factory.createProperty({ name: 'day', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
          ast.factory.createProperty({ name: 'pending', required: false, schema: ast.factory.createSchema({ type: 'boolean' }) }),
        ],
      })
      expect(p.print(node)).toMatchInlineSnapshot(`
        "z.object({
          day: z.string(),
          pending: z.boolean().optional(),
        }).omit({ "pending": true }).nullable()"
      `)
    })
  })

  describe('nodes override', () => {
    test('override can call this.transform for nested nodes', () => {
      const p = printerZod({
        nodes: {
          array(node: ast.ArraySchemaNode) {
            const inner =
              node.items?.map((item: ast.SchemaNode) => (this as { transform: (n: ast.SchemaNode) => string }).transform(item)).join(', ') ?? 'z.unknown()'
            return `z.set(${inner})`
          },
        },
      })
      const node = ast.factory.createSchema({ type: 'array', items: [ast.factory.createSchema({ type: 'string' })] })
      expect(p.print(node)).toBe('z.set(z.string())')
    })

    test('override can read this.options', () => {
      const p = printerZod({
        coercion: true,
        nodes: {
          string() {
            return (this as { options: { coercion?: boolean } }).options.coercion ? 'z.coerce.string().custom()' : 'z.string()'
          },
        },
      })
      expect(p.print(ast.factory.createSchema({ type: 'string' }))).toBe('z.coerce.string().custom()')
    })
  })
})
