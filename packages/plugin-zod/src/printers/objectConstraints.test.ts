import { adapterOas } from '@kubb/adapter-oas'
import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as mini from 'zod/mini'
import { printerZod } from './printerZod.ts'
import { printerZodMini } from './printerZodMini.ts'

describe.each([
  { name: 'Zod', createPrinter: printerZod, runtime: z },
  { name: 'Zod Mini', createPrinter: printerZodMini, runtime: mini },
])('$name object property counts', ({ createPrinter, runtime }) => {
  const property = ast.factory.createProperty({ name: 'a', schema: ast.factory.createSchema({ type: 'string', optional: true }) })
  const printer = createPrinter({})
  const evaluate = (source: string | null): z.ZodType => new Function('z', `return ${source}`)(runtime)

  test('preserves property counts from an OpenAPI 3.1 document', async () => {
    const root = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: JSON.stringify({
        openapi: '3.1.0',
        info: { title: 'r', version: '1' },
        paths: {},
        components: {
          schemas: {
            MinProps: { type: 'object', minProperties: 1, properties: { a: { type: 'string' } } },
            MaxProps: { type: 'object', maxProperties: 0, properties: { a: { type: 'string' } } },
          },
        },
      }),
    })
    const min = evaluate(printer.print(root.schemas.find((node) => node.name === 'MinProps')!))
    const max = evaluate(printer.print(root.schemas.find((node) => node.name === 'MaxProps')!))
    expect(min.safeParse({}).success).toBe(false)
    expect(min.parse({ a: 'a' })).toStrictEqual({ a: 'a' })
    expect(max.parse({})).toStrictEqual({})
    expect(max.safeParse({ a: 'a' }).success).toBe(false)
  })

  test.each([
    { minProperties: 1, input: {}, valid: false },
    { minProperties: 1, input: { a: 'a' }, valid: true },
    { maxProperties: 1, input: { a: 'a', b: 'b' }, valid: false },
    { maxProperties: 1, input: { a: 'a' }, valid: true },
    { maxProperties: 0, input: {}, valid: true },
    { maxProperties: 0, input: { a: 'a' }, valid: false },
    { minProperties: 0, input: {}, valid: true },
    { minProperties: 1, maxProperties: 2, input: { a: 'a', b: 'b' }, valid: true },
    { minProperties: 1, maxProperties: 2, input: {}, valid: false },
    { minProperties: 1, maxProperties: 2, input: { a: 'a', b: 'b', c: 'c' }, valid: false },
  ])('enforces $minProperties <= property count <= $maxProperties for $input', ({ input, valid, ...constraints }) => {
    const node = ast.factory.createSchema({ type: 'object', properties: [property], ...constraints })
    const schema = evaluate(printer.print(node))
    expect(schema.safeParse(input).success).toBe(valid)
  })

  test('counts input keys before unknown properties are stripped', () => {
    const node = ast.factory.createSchema({ type: 'object', properties: [property], minProperties: 1 })
    expect(evaluate(printer.print(node)).parse({ b: 'b' })).toStrictEqual({})
  })

  test('does not count properties inserted by defaults', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      minProperties: 1,
      properties: [ast.factory.createProperty({ name: 'a', schema: ast.factory.createSchema({ type: 'string', default: 'a' }) })],
    })
    expect(evaluate(printer.print(node)).safeParse({}).success).toBe(false)
  })

  test.each([true, false, ast.factory.createSchema({ type: 'string' })])('enforces bounds with additionalProperties: %s', (additionalProperties) => {
    const node = ast.factory.createSchema({ type: 'object', additionalProperties, minProperties: 1, maxProperties: 1 })
    const schema = evaluate(printer.print(node))
    expect(schema.safeParse({}).success).toBe(false)
    expect(schema.safeParse({ a: 'a', b: 'b' }).success).toBe(false)
    expect(schema.safeParse({ a: 'a' }).success).toBe(additionalProperties !== false)
  })

  test('preserves nullable and optional object modifiers', () => {
    const node = ast.factory.createSchema({ type: 'object', minProperties: 1, nullable: true, optional: true })
    const schema = evaluate(printer.print(node))
    expect(schema.parse(null)).toBeNull()
    expect(schema.parse(undefined)).toBeUndefined()
    expect(schema.safeParse({}).success).toBe(false)
    expect(schema.safeParse('a').success).toBe(false)
    expect(schema.safeParse([]).success).toBe(false)
  })

  test.each([true, false])('preserves constraints on an allOf member when first: %s', (first) => {
    const constrained = ast.factory.createSchema({ type: 'object', properties: [property], minProperties: 1 })
    const other = ast.factory.createSchema({ type: 'object', properties: [] })
    const node = ast.factory.createSchema({ type: 'intersection', members: first ? [constrained, other] : [other, constrained] })
    const schema = evaluate(printer.print(node))
    expect(schema.safeParse({}).success).toBe(false)
    expect(schema.parse({ a: 'a' })).toStrictEqual({ a: 'a' })
  })

  test('preserves constraints when omitting an object property', () => {
    const node = ast.factory.createSchema({ type: 'object', primitive: 'object', properties: [property], minProperties: 1 })
    const schema = evaluate(createPrinter({ keysToOmit: ['a'] }).print(node))
    expect(schema.safeParse({}).success).toBe(false)
    expect(schema.parse({ a: 'a' })).toStrictEqual({})
  })

  test('enforces bounds on nested objects', () => {
    const node = ast.factory.createSchema({
      type: 'object',
      properties: [ast.factory.createProperty({ name: 'nested', required: true, schema: ast.factory.createSchema({ type: 'object', maxProperties: 0 }) })],
    })
    const schema = evaluate(printer.print(node))
    expect(schema.parse({ nested: {} })).toStrictEqual({ nested: {} })
    expect(schema.safeParse({ nested: { a: 'a' } }).success).toBe(false)
  })

  test('enforces bounds on discriminated union members', () => {
    const member = ast.factory.createSchema({
      type: 'object',
      minProperties: 2,
      properties: [
        ast.factory.createProperty({ name: 'kind', required: true, schema: ast.factory.createSchema({ type: 'enum', enumValues: ['a'] }) }),
        property,
      ],
    })
    const other = ast.factory.createSchema({
      type: 'object',
      properties: [ast.factory.createProperty({ name: 'kind', required: true, schema: ast.factory.createSchema({ type: 'enum', enumValues: ['b'] }) })],
    })
    const node = ast.factory.createSchema({ type: 'union', discriminatorPropertyName: 'kind', members: [member, other] })
    const schema = evaluate(printer.print(node))
    expect(schema.safeParse({ kind: 'a' }).success).toBe(false)
    expect(schema.parse({ kind: 'a', a: 'a' })).toStrictEqual({ kind: 'a', a: 'a' })
    expect(schema.parse({ kind: 'b' })).toStrictEqual({ kind: 'b' })
  })
})
