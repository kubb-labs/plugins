import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import { resolverEffect } from '../resolvers/resolverEffect.ts'
import { printerEffect } from './printerEffect.ts'

describe('printerEffect', () => {
  const printer = printerEffect({ resolver: resolverEffect, regexType: 'constructor' })

  test('prints scalar checks without validating formats', () => {
    expect(printer.print(ast.factory.createSchema({ type: 'email', min: 3, format: 'email' }))).toEqual({
      runtime: 'Schema.String.check(Schema.isMinLength(3)).annotate({ format: "email" })',
      type: 'string',
      encoded: 'string',
    })
    expect(printer.print(ast.factory.createSchema({ type: 'integer', min: 1, exclusiveMaximum: 10, multipleOf: 2 }))).toEqual({
      runtime: 'Schema.Int.check(Schema.isGreaterThanOrEqualTo(1), Schema.isLessThan(10), Schema.isMultipleOf(2))',
      type: 'number',
      encoded: 'number',
    })
  })

  test('keeps defaults as annotations', () => {
    expect(printer.print(ast.factory.createSchema({ type: 'string', default: 'draft' }))).toEqual({
      runtime: 'Schema.String.annotate({ default: "draft" })',
      type: 'string',
      encoded: 'string',
    })
  })

  test('prints optional and nullable object properties', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
        ast.factory.createProperty({ name: 'display-name', required: false, schema: ast.factory.createSchema({ type: 'string', nullable: true }) }),
      ],
    })
    expect(printer.print(node)).toEqual({
      runtime: 'Schema.Struct({ id: Schema.Int, "display-name": Schema.optionalKey(Schema.NullOr(Schema.String)) })',
      type: '{ readonly id: number; readonly "display-name"?: string | null }',
      encoded: '{ readonly id: number; readonly "display-name"?: string | null }',
    })
  })

  test('prints records and oneOf unions', () => {
    const record = ast.factory.createSchema({ type: 'object', properties: [], additionalProperties: ast.factory.createSchema({ type: 'string' }) })
    expect(printer.print(record)?.runtime).toBe('Schema.StructWithRest(Schema.Struct({}), [Schema.Record(Schema.String, Schema.String)])')

    const oneOf = ast.factory.createSchema({
      type: 'union',
      strategy: 'one',
      members: [ast.factory.createSchema({ type: 'string' }), ast.factory.createSchema({ type: 'number' })],
    })
    expect(printer.print(oneOf)?.runtime).toBe('Schema.Union([Schema.String, Schema.Finite], { mode: "oneOf" })')
  })

  test('omits fields from referenced operation schemas', () => {
    const schema = ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({ name: 'id', required: true, schema: ast.factory.createSchema({ type: 'integer' }) }),
        ast.factory.createProperty({ name: 'secret', required: true, schema: ast.factory.createSchema({ type: 'string' }) }),
      ],
    })
    const ref = ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet', schema })
    const operationPrinter = printerEffect({ resolver: resolverEffect, keysToOmit: ['secret'] })
    expect(operationPrinter.print(ref)).toEqual({
      runtime: 'Schema.Struct(Struct.omit(Pet.fields, ["secret"]))',
      type: 'Omit<NonNullable<Pet>, "secret">',
      encoded: 'Omit<NonNullable<typeof Pet.Encoded>, "secret">',
    })
  })

  test('prints date-only codecs with distinct decoded and encoded types', () => {
    expect(printer.print(ast.factory.createSchema({ type: 'date', representation: 'date', format: 'date' }))).toEqual({
      runtime:
        'Schema.String.pipe(Schema.decodeTo(Schema.DateValid, { decode: SchemaGetter.transform((value) => new Date(`${value}T00:00:00.000Z`)), encode: SchemaGetter.transform((value) => value.toISOString().slice(0, 10)) })).annotate({ format: "date" })',
      type: 'Date',
      encoded: 'string',
    })
  })

  test('decodes JSON int64 numbers to bigint values', () => {
    expect(printer.print(ast.factory.createSchema({ type: 'bigint', format: 'int64', examples: [100_000] }))).toEqual({
      runtime:
        'Schema.Int.pipe(Schema.decodeTo(Schema.BigInt, { decode: SchemaGetter.transform((value) => BigInt(value)), encode: SchemaGetter.transform((value) => Number(value)) })).annotate({ format: "int64", examples: [BigInt("100000")] })',
      type: 'bigint',
      encoded: 'number',
    })
  })

  test('prints Effect DateTime codecs and annotations', () => {
    const node = ast.factory.createSchema({
      type: 'date',
      representation: 'date',
      format: 'date-time',
      default: '2026-07-14T10:30:00.000Z',
      examples: ['2026-07-15T10:30:00.000Z'],
    })
    expect(printer.print(node)).toEqual({
      runtime:
        'Schema.DateTimeUtcFromString.annotate({ format: "date-time", default: DateTime.makeUnsafe("2026-07-14T10:30:00.000Z"), examples: [DateTime.makeUnsafe("2026-07-15T10:30:00.000Z")] })',
      type: 'DateTime.Utc',
      encoded: 'string',
    })
  })

  test('converts DateTime values inside referenced object examples', () => {
    const schema = ast.factory.createSchema({
      type: 'object',
      properties: [
        ast.factory.createProperty({
          name: 'createdDate',
          required: true,
          schema: ast.factory.createSchema({ type: 'date', representation: 'date', format: 'date-time' }),
        }),
      ],
    })
    const ref = ast.factory.createSchema({
      type: 'ref',
      name: 'Order',
      ref: '#/components/schemas/Order',
      schema,
      examples: [{ createdDate: '2026-07-14T10:30:00.000Z' }],
    })

    expect(printer.print(ref)?.runtime).toBe('Order.annotate({ examples: [{ createdDate: DateTime.makeUnsafe("2026-07-14T10:30:00.000Z") }] })')
  })

  test('prints recursive refs with an explicit codec contract', () => {
    const cyclic = printerEffect({ resolver: resolverEffect, cyclicSchemas: new Set(['Pet']), currentSchemaName: 'Pet' })
    expect(cyclic.print(ast.factory.createSchema({ type: 'ref', name: 'Pet', ref: '#/components/schemas/Pet' }))).toEqual({
      runtime: 'Schema.suspend((): Schema.Codec<Pet, PetEncoded> => Pet)',
      type: 'Pet',
      encoded: 'PetEncoded',
    })
  })

  test('rejects transforming intersections that cannot be represented safely', () => {
    const node = ast.factory.createSchema({
      type: 'intersection',
      name: 'Timed',
      members: [ast.factory.createSchema({ type: 'date', representation: 'date' }), ast.factory.createSchema({ type: 'unknown' })],
    })
    expect(() => printer.print(node)).toThrowError('Effect cannot safely compose a transforming allOf schema "Timed"')
  })

  test('supports node overrides without losing encoded types', () => {
    const custom = printerEffect({
      nodes: {
        string(node) {
          const base = this.base(node)
          if (!base) return null
          return { ...base, runtime: `${base.runtime}.annotate({ title: "Custom" })` }
        },
      },
    })
    expect(custom.print(ast.factory.createSchema({ type: 'string' }))).toEqual({
      runtime: 'Schema.String.annotate({ title: "Custom" })',
      type: 'string',
      encoded: 'string',
    })
  })
})
