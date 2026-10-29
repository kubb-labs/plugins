import { adapterOas } from '@kubb/adapter-oas'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as mini from 'zod/mini'
import { printerZod } from './printerZod.ts'
import { printerZodMini } from './printerZodMini.ts'

async function parseSchema({
  runtime,
  createPrinter,
  schemas,
}: {
  runtime: unknown
  createPrinter: typeof printerZod | typeof printerZodMini
  schemas: Record<string, unknown>
}) {
  const root = await adapterOas({ validate: false }).parse({
    type: 'data',
    data: JSON.stringify({ openapi: '3.1.0', info: { title: 'not', version: '1' }, paths: {}, components: { schemas } }),
  })
  const printer = createPrinter({})
  const sources = root.schemas.map((node) => `const ${node.name} = ${printer.print(node)}`).join('\n')

  return new Function('z', `${sources}\nreturn Target`)(runtime) as z.ZodType
}

describe.each([
  { name: 'Zod', createPrinter: printerZod, runtime: z },
  { name: 'Zod Mini', createPrinter: printerZodMini, runtime: mini },
])('$name not', ({ createPrinter, runtime }) => {
  test('excludes a const from the sibling type', async () => {
    const schema = await parseSchema({ runtime, createPrinter, schemas: { Target: { type: 'integer', not: { const: 0 } } } })

    expect(schema.safeParse(1).success).toBe(true)
    expect(schema.safeParse(0).success).toBe(false)
    expect(schema.safeParse('1').success).toBe(false)
  })

  test('excludes enum values', async () => {
    const schema = await parseSchema({ runtime, createPrinter, schemas: { Target: { type: 'string', not: { enum: ['admin', 'root'] } } } })

    expect(schema.safeParse('guest').success).toBe(true)
    expect(schema.safeParse('admin').success).toBe(false)
  })

  test('excludes a type without siblings', async () => {
    const schema = await parseSchema({ runtime, createPrinter, schemas: { Target: { not: { type: 'string' } } } })

    expect(schema.safeParse(1).success).toBe(true)
    expect(schema.safeParse({}).success).toBe(true)
    expect(schema.safeParse('a').success).toBe(false)
  })

  test('excludes a referenced schema', async () => {
    const schema = await parseSchema({
      runtime,
      createPrinter,
      schemas: {
        Reserved: { type: 'string', enum: ['admin'] },
        Target: { type: 'string', not: { $ref: '#/components/schemas/Reserved' } },
      },
    })

    expect(schema.safeParse('guest').success).toBe(true)
    expect(schema.safeParse('admin').success).toBe(false)
  })

  test('rejects objects that hold a forbidden property', async () => {
    const schema = await parseSchema({
      runtime,
      createPrinter,
      schemas: {
        Target: { type: 'object', properties: { id: { type: 'string' }, secret: { type: 'string' } }, required: ['id'], not: { required: ['secret'] } },
      },
    })

    expect(schema.safeParse({ id: 'a' }).success).toBe(true)
    expect(schema.safeParse({ id: 'a', secret: 's' }).success).toBe(false)
  })
})
