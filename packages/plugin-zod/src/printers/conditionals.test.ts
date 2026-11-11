import { adapterOas } from '@kubb/adapter-oas'
import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as mini from 'zod/mini'
import { printerZod } from './printerZod.ts'
import { printerZodMini } from './printerZodMini.ts'

const document = {
  openapi: '3.1.0',
  info: { title: 'conditionals', version: '1' },
  paths: {},
  components: {
    schemas: {
      Payment: {
        type: 'object',
        properties: { method: { type: 'string', enum: ['card', 'cash'] }, creditCard: { type: 'string' }, billingAddress: { type: 'string' } },
        dependentRequired: { creditCard: ['billingAddress'] },
        if: { properties: { method: { const: 'card' } }, required: ['method'] },
        then: { required: ['creditCard'] },
      },
      Labels: { type: 'array', items: { type: 'string' }, contains: { const: 'priority' }, minContains: 1, maxContains: 2 },
      Card: { type: 'object', properties: { number: { type: 'string' }, cvc: { type: 'string' } }, dependentRequired: { number: ['cvc'] } },
      Cash: { type: 'object', properties: { amount: { type: 'number' } } },
      Choice: { oneOf: [{ $ref: '#/components/schemas/Card' }, { $ref: '#/components/schemas/Cash' }] },
      AnyObject: { if: { type: 'object' }, then: { required: ['id'] } },
      Shipping: {
        type: 'object',
        properties: { express: { type: 'boolean' } },
        dependentSchemas: { express: { properties: { fee: { type: 'number' } }, required: ['fee'] } },
      },
      Guarded: { $ref: '#/components/schemas/Cash', if: { required: ['amount'] }, then: { required: ['currency'] } },
      Tags: { type: 'object', properties: { id: { type: 'string' } }, propertyNames: { pattern: '^[a-z]+$' } },
    },
  },
}

describe.each([
  { name: 'Zod', createPrinter: printerZod, runtime: z },
  { name: 'Zod Mini', createPrinter: printerZodMini, runtime: mini },
])('$name conditionals and contains', async ({ createPrinter, runtime }) => {
  const root = await adapterOas({ validate: false }).parse({ type: 'data', data: JSON.stringify(document) })
  const printer = createPrinter({})
  const evaluate = (name: string): z.ZodType => new Function('z', `return ${printer.print(root.schemas.find((node) => node.name === name)!)}`)(runtime)

  test.each([
    { input: { method: 'cash' }, valid: true },
    { input: { method: 'card' }, valid: false },
    { input: { method: 'card', creditCard: '4111' }, valid: false },
    { input: { method: 'card', creditCard: '4111', billingAddress: 'Main St 1' }, valid: true },
    { input: { method: 'cash', creditCard: '4111' }, valid: false },
  ])('checks if/then and dependentRequired for $input', ({ input, valid }) => {
    expect(evaluate('Payment').safeParse(input).success).toBe(valid)
  })

  test('does not call `.strict()` on a oneOf member that checks its input in a pipe', () => {
    const choice = printer.print(root.schemas.find((node) => node.name === 'Choice')!)
    expect(choice).not.toContain('Card.strict()')
  })

  test('reads an `if` object without properties as "is an object"', () => {
    const schema = evaluate('AnyObject')
    expect(schema.safeParse({}).success).toBe(false)
    expect(schema.safeParse({ id: 1 }).success).toBe(true)
  })

  test.each([
    { input: {}, valid: true },
    { input: { express: true }, valid: false },
    { input: { express: true, fee: 2 }, valid: true },
  ])('checks dependentSchemas for $input', ({ input, valid }) => {
    expect(evaluate('Shipping').safeParse(input).success).toBe(valid)
  })

  test('keeps the conditionals a `$ref` carries itself', () => {
    const guarded = new Function('z', 'cashSchema', `return ${printer.print(root.schemas.find((node) => node.name === 'Guarded')!)}`)(runtime, evaluate('Cash'))
    expect(guarded.safeParse({ amount: 1 }).success).toBe(false)
    expect(guarded.safeParse({ amount: 1, currency: 'EUR' }).success).toBe(true)
  })

  test.each([
    { input: { id: 'a', extra: 1 }, valid: true },
    { input: { id: 'a', Extra: 1 }, valid: false },
  ])('checks propertyNames next to declared properties for $input', ({ input, valid }) => {
    expect(evaluate('Tags').safeParse(input).success).toBe(valid)
  })

  test('reads the deprecated count and exclusive fields of a custom node', () => {
    const evaluateNode = (node: ast.SchemaNode): z.ZodType => new Function('z', `return ${printer.print(node)}`)(runtime)
    const object = evaluateNode(ast.factory.createSchema({ type: 'object', properties: [], minProperties: 1, maxProperties: 2 }))
    expect(object.safeParse({}).success).toBe(false)
    expect(object.safeParse({ a: 1 }).success).toBe(true)
    expect(object.safeParse({ a: 1, b: 2, c: 3 }).success).toBe(false)

    const number = evaluateNode(ast.factory.createSchema({ type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 10 }))
    expect(number.safeParse(0).success).toBe(false)
    expect(number.safeParse(5).success).toBe(true)
    expect(number.safeParse(10).success).toBe(false)
  })

  test.each([
    { input: ['a'], valid: false },
    { input: ['priority', 'a'], valid: true },
    { input: ['priority', 'priority', 'priority'], valid: false },
  ])('counts the items that match contains for $input', ({ input, valid }) => {
    expect(evaluate('Labels').safeParse(input).success).toBe(valid)
  })
})
