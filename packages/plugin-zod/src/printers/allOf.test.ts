import { adapterOas } from '@kubb/adapter-oas'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as mini from 'zod/mini'
import { printerZod } from './printerZod.ts'
import { printerZodMini } from './printerZodMini.ts'

describe.each([
  { name: 'Zod', createPrinter: printerZod, runtime: z },
  { name: 'Zod Mini', createPrinter: printerZodMini, runtime: mini },
])('$name allOf required properties', ({ createPrinter, runtime }) => {
  test.each([
    { nested: false, required: true },
    { nested: true, required: true },
    { nested: false, required: false },
  ])('preserves property requiredness from a referenced base: %j', async ({ nested, required }) => {
    const root = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'allOf', version: '1' },
        paths: {},
        components: {
          schemas: {
            Base: {
              type: 'object',
              required: required ? ['kind', 'message'] : ['message'],
              properties: {
                kind: { type: 'string', enum: ['A', 'B'] },
                message: { type: 'string' },
              },
            },
            Intermediate: { allOf: [{ $ref: '#/components/schemas/Base' }, { type: 'object', properties: { kind: { enum: ['B'] } } }] },
            Narrowed: {
              allOf: [
                { $ref: nested ? '#/components/schemas/Intermediate' : '#/components/schemas/Base' },
                { type: 'object', properties: { kind: { type: 'string', enum: ['B'] }, detail: { type: 'string' } } },
                { type: 'object', properties: { kind: { type: 'string', enum: ['B'] } } },
              ],
            },
          },
        },
      }),
    })
    const printer = createPrinter({})
    const sources = root.schemas.map((node) => `const ${node.name} = ${printer.print(node)}`).join('\n')
    const schema = new Function('z', `${sources}\nreturn Narrowed`)(runtime) as z.ZodType

    expect(schema.safeParse({ message: 'm' }).success).toBe(!required)
    expect(schema.safeParse({ kind: 'A', message: 'm' }).success).toBe(false)
    expect(schema.safeParse({ kind: 'B' }).success).toBe(false)
    expect(schema.safeParse({ kind: 'B', message: 'm' }).success).toBe(true)
    expect(schema.safeParse({ kind: 'B', message: 'm', detail: 'd' }).success).toBe(true)
  })
})
