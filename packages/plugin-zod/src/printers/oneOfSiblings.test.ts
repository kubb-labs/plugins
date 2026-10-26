import { adapterOas } from '@kubb/adapter-oas'
import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as mini from 'zod/mini'
import { prepareOneOfSiblings } from '../utils.ts'
import { printerZod } from './printerZod.ts'
import { printerZodMini } from './printerZodMini.ts'

describe.each([
  { name: 'Zod', createPrinter: printerZod, runtime: z },
  { name: 'Zod Mini', createPrinter: printerZodMini, runtime: mini },
])('$name oneOf with sibling properties', ({ createPrinter, runtime }) => {
  test('keeps referenced single-member oneOf compositions usable as discriminator variants', () => {
    const printer = createPrinter({})
    const vehicle = ast.factory.createSchema({ type: 'object', properties: [] })
    const variant = (name: string) =>
      ast.factory.createSchema({
        type: 'intersection',
        members: [
          ast.factory.createSchema({ type: 'union', strategy: 'one', members: [ast.factory.createSchema({ type: 'ref', name: 'vehicle', schema: vehicle })] }),
          ast.factory.createSchema({
            type: 'object',
            properties: [
              ast.factory.createProperty({
                name: 'type',
                required: true,
                schema: ast.factory.createSchema({ type: 'enum', enumValues: [name] }),
              }),
            ],
          }),
        ],
      })
    const suv = variant('SUV')
    const sedan = variant('Sedan')
    const car = ast.factory.createSchema({
      type: 'union',
      strategy: 'one',
      discriminatorPropertyName: 'type',
      members: [
        { name: 'SUV', schema: suv },
        { name: 'Sedan', schema: sedan },
      ].map(({ name, schema }) =>
        ast.factory.createSchema({
          type: 'intersection',
          members: [
            ast.factory.createSchema({ type: 'ref', name, schema }),
            ast.factory.createSchema({
              type: 'object',
              properties: [
                ast.factory.createProperty({
                  name: 'type',
                  required: true,
                  schema: ast.factory.createSchema({ type: 'enum', enumValues: [name] }),
                }),
              ],
            }),
          ],
        }),
      ),
    })
    const source = printer.print(car)
    expect(source).toContain("z.discriminatedUnion('type'")
    const schema: z.ZodType = new Function(
      'z',
      `const vehicle = ${printer.print(vehicle)}; const SUV = ${printer.print(suv)}; const Sedan = ${printer.print(sedan)}; return ${source}`,
    )(runtime)

    expect(schema.safeParse({ type: 'SUV' }).success).toBe(true)
    expect(schema.safeParse({ type: 'Sedan' }).success).toBe(true)
    expect(schema.safeParse({ type: 'Other' }).success).toBe(false)
  })

  test('preserves narrowed discriminators when sibling properties declare the same key', () => {
    const kind = (values: Array<string>) =>
      ast.factory.createProperty({ name: 'kind', required: true, schema: ast.factory.createSchema({ type: 'enum', enumValues: values }) })
    const node = ast.factory.createSchema({
      type: 'intersection',
      members: [
        ast.factory.createSchema({
          type: 'union',
          strategy: 'one',
          discriminatorPropertyName: 'kind',
          members: ['a', 'b'].map((name) =>
            ast.factory.createSchema({
              type: 'object',
              properties: [kind([name]), ast.factory.createProperty({ name, required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
            }),
          ),
        }),
        ast.factory.createSchema({ type: 'object', properties: [kind(['a', 'b'])] }),
      ],
    })
    const source = createPrinter({}).print(node)
    expect(source).toContain("z.discriminatedUnion('kind'")
    const schema: z.ZodType = new Function('z', `return ${source}`)(runtime)

    expect(schema.safeParse({ kind: 'a', a: 'x' }).success).toBe(true)
    expect(schema.safeParse({ kind: 'b', b: 'x' }).success).toBe(true)
    expect(schema.safeParse({ kind: 'a', b: 'x' }).success).toBe(false)
    expect(schema.safeParse({ kind: 'b', a: 'x' }).success).toBe(false)
  })

  test.each([
    { references: true, oneOfType: 'union' },
    { references: false, oneOfType: 'union' },
    { references: true, oneOfType: 'xor' },
    { references: false, oneOfType: 'xor' },
  ] as const)('accepts sibling properties with references=$references and oneOfType=$oneOfType', ({ references, oneOfType }) => {
    const printer = createPrinter({ oneOfType })
    const variants = ['a', 'b'].map((name) =>
      ast.factory.createSchema({
        type: 'object',
        properties: [ast.factory.createProperty({ name, required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
      }),
    )
    const node = ast.factory.createSchema({
      type: 'intersection',
      members: [
        ast.factory.createSchema({
          type: 'union',
          strategy: 'one',
          members: variants.map((schema, index) => (references ? ast.factory.createSchema({ type: 'ref', name: `variant${index}`, schema }) : schema)),
        }),
        ast.factory.createSchema({
          type: 'object',
          properties: [ast.factory.createProperty({ name: 'shared', required: true, schema: ast.factory.createSchema({ type: 'string' }) })],
        }),
      ],
    })
    const source = printer.print(node)
    const schema: z.ZodType = new Function(
      'z',
      `const variant0 = ${printer.print(variants[0]!)}; const variant1 = ${printer.print(variants[1]!)}; return ${source}`,
    )(runtime)

    expect(schema.safeParse({ a: 'x', shared: 'y' }).success).toBe(true)
    expect(schema.safeParse({ b: 'x', shared: 'y' }).success).toBe(true)
    expect(schema.safeParse({ a: 'x' }).success).toBe(false)
    expect(schema.safeParse({ shared: 'y' }).success).toBe(false)
    expect(schema.safeParse({ a: 1, shared: 'y' }).success).toBe(false)
    expect(schema.safeParse({ a: 'x', b: 'x', shared: 'y' }).success).toBe(oneOfType === 'union')
  })

  test.each(['3.0.0', '3.1.0'])('enforces parent required member properties from OpenAPI %s without changing the referenced schema', async (openapi) => {
    const adapter = adapterOas({ validate: false })
    const root = await adapter.parse({
      type: 'data',
      data: {
        openapi,
        info: { title: 'oneOf siblings', version: '1' },
        paths: {},
        components: {
          schemas: {
            A: { type: 'object', properties: { a: { type: 'string' } } },
            B: { type: 'object', properties: { b: { type: 'string' } } },
            Pet: {
              type: 'object',
              required: ['a', 'shared'],
              properties: { shared: { type: 'string' } },
              oneOf: [{ $ref: '#/components/schemas/A' }, { $ref: '#/components/schemas/B' }],
            },
          },
        },
      },
    })
    const printer = createPrinter({})
    const pet = root.schemas.find((node) => node.name === 'Pet')!
    const prepared = ast.applyMacros(pet, [{ name: 'oneOfSiblings', schema: (node) => prepareOneOfSiblings({ node, document: adapter.document }) }])
    const source = root.schemas
      .filter((node) => node.name !== 'Pet')
      .map((node) => `const ${node.name} = ${printer.print(node)};`)
      .join('\n')
    const { schema, a }: { schema: z.ZodType; a: z.ZodType } = new Function('z', `${source}\nreturn { schema: ${printer.print(prepared)}, a: A }`)(runtime)

    expect(schema.safeParse({ a: 'x', shared: 'y' }).success).toBe(true)
    expect(schema.safeParse({ shared: 'y' }).success).toBe(false)
    expect(schema.safeParse({ b: 'x', shared: 'y' }).success).toBe(false)
    expect(schema.safeParse({ a: 'x' }).success).toBe(false)
    expect(schema.safeParse({ a: 1, shared: 'y' }).success).toBe(false)
    expect(a.safeParse({}).success).toBe(true)
  })
})
