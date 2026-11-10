import { adapterOas } from '@kubb/adapter-oas'
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
      Payload: { type: 'string', contentMediaType: 'application/json', contentSchema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } } },
      Encoded: {
        type: 'string',
        contentMediaType: 'application/json',
        contentEncoding: 'base64',
        contentSchema: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } },
      },
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
    { input: ['a'], valid: false },
    { input: ['priority', 'a'], valid: true },
    { input: ['priority', 'priority', 'priority'], valid: false },
  ])('counts the items that match contains for $input', ({ input, valid }) => {
    expect(evaluate('Labels').safeParse(input).success).toBe(valid)
  })
})

describe.each([
  { name: 'Zod', createPrinter: printerZod, runtime: z },
  { name: 'Zod Mini', createPrinter: printerZodMini, runtime: mini },
])('$name contentSchema', async ({ createPrinter, runtime }) => {
  const root = await adapterOas({ validate: false }).parse({ type: 'data', data: JSON.stringify(document) })
  const evaluate = (name: string, contentSchema: boolean): z.ZodType =>
    new Function('z', `return ${createPrinter({ contentSchema }).print(root.schemas.find((node) => node.name === name)!)}`)(runtime)

  test('checks the JSON a string holds only when the option is on', () => {
    expect(evaluate('Payload', true).safeParse('{"id":1}').success).toBe(true)
    expect(evaluate('Payload', true).safeParse('{"id":"x"}').success).toBe(false)
    expect(evaluate('Payload', true).safeParse('not json').success).toBe(false)
    expect(evaluate('Payload', false).safeParse('not json').success).toBe(true)
  })

  test('decodes base64 content before checking it', () => {
    expect(evaluate('Encoded', true).safeParse(btoa('{"id":1}')).success).toBe(true)
    expect(evaluate('Encoded', true).safeParse(btoa('{}')).success).toBe(false)
  })
})
