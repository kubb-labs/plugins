import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import * as mini from 'zod/mini'
import { printerZod } from './printerZod.ts'
import { printerZodMini } from './printerZodMini.ts'

describe.each([
  { name: 'Zod', createPrinter: printerZod, runtime: z },
  { name: 'Zod Mini', createPrinter: printerZodMini, runtime: mini },
])('$name oneOf with sibling properties', ({ createPrinter, runtime }) => {
  test('accepts required unknown keys from the adapter without narrowing other variants', () => {
    const property = ({ name, required, type }: { name: string; required: boolean; type: typeof ast.schemaTypes.string | typeof ast.schemaTypes.unknown }) =>
      ast.factory.createProperty({ name, required, schema: ast.factory.createSchema({ type }) })
    const node = ast.factory.createSchema({
      type: ast.schemaTypes.intersection,
      members: [
        ast.factory.createSchema({
          type: ast.schemaTypes.union,
          strategy: 'one',
          members: [
            ast.factory.createSchema({ type: ast.schemaTypes.object, properties: [property({ name: 'a', required: false, type: ast.schemaTypes.string })] }),
            ast.factory.createSchema({ type: ast.schemaTypes.object, properties: [property({ name: 'b', required: false, type: ast.schemaTypes.string })] }),
          ],
        }),
        ast.factory.createSchema({ type: ast.schemaTypes.object, properties: [property({ name: 'shared', required: true, type: ast.schemaTypes.string })] }),
        ast.factory.createSchema({ type: ast.schemaTypes.object, properties: [property({ name: 'a', required: true, type: ast.schemaTypes.unknown })] }),
      ],
    })
    const schema: z.ZodType = new Function('z', `return ${createPrinter({}).print(node)}`)(runtime)

    expect(schema.safeParse({ a: 'x', shared: 'y' }).success).toBe(true)
    expect(schema.safeParse({ a: 42, b: 'x', shared: 'y' }).success).toBe(true)
    expect(schema.safeParse({ b: 'x', shared: 'y' }).success).toBe(false)
    expect(schema.safeParse({ a: 42, b: 42, shared: 'y' }).success).toBe(false)
    expect(schema.safeParse({ a: 'x' }).success).toBe(false)
  })

  test('keeps the same union strict when printed without sibling properties', () => {
    const printer = createPrinter({})
    const union = ast.factory.createSchema({
      type: ast.schemaTypes.union,
      strategy: 'one',
      members: ['a', 'b'].map((name) =>
        ast.factory.createSchema({
          type: ast.schemaTypes.object,
          properties: [ast.factory.createProperty({ name, required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) })],
        }),
      ),
    })
    const node = ast.factory.createSchema({
      type: ast.schemaTypes.intersection,
      members: [
        union,
        ast.factory.createSchema({
          type: ast.schemaTypes.object,
          properties: [ast.factory.createProperty({ name: 'shared', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) })],
        }),
      ],
    })
    const withSiblings: z.ZodType = new Function('z', `return ${printer.print(node)}`)(runtime)
    const standalone: z.ZodType = new Function('z', `return ${printer.print(union)}`)(runtime)

    expect(withSiblings.safeParse({ a: 'x', shared: 'y' }).success).toBe(true)
    expect(standalone.safeParse({ a: 'x', shared: 'y' }).success).toBe(false)
    expect(standalone.safeParse({ a: 'x' }).success).toBe(true)
    expect(union.strategy).toBe('one')
  })

  test('keeps referenced single-member oneOf compositions usable as discriminator variants', () => {
    const printer = createPrinter({})
    const vehicle = ast.factory.createSchema({ type: ast.schemaTypes.object, properties: [] })
    const variant = (name: string) =>
      ast.factory.createSchema({
        type: ast.schemaTypes.intersection,
        members: [
          ast.factory.createSchema({
            type: ast.schemaTypes.union,
            strategy: 'one',
            members: [ast.factory.createSchema({ type: ast.schemaTypes.ref, name: 'vehicle', schema: vehicle })],
          }),
          ast.factory.createSchema({
            type: ast.schemaTypes.object,
            properties: [
              ast.factory.createProperty({
                name: 'type',
                required: true,
                schema: ast.factory.createSchema({ type: ast.schemaTypes.enum, enumValues: [name] }),
              }),
            ],
          }),
        ],
      })
    const suv = variant('SUV')
    const sedan = variant('Sedan')
    const car = ast.factory.createSchema({
      type: ast.schemaTypes.union,
      strategy: 'one',
      discriminatorPropertyName: 'type',
      members: [
        { name: 'SUV', schema: suv },
        { name: 'Sedan', schema: sedan },
      ].map(({ name, schema }) =>
        ast.factory.createSchema({
          type: ast.schemaTypes.intersection,
          members: [
            ast.factory.createSchema({ type: ast.schemaTypes.ref, name, schema }),
            ast.factory.createSchema({
              type: ast.schemaTypes.object,
              properties: [
                ast.factory.createProperty({
                  name: 'type',
                  required: true,
                  schema: ast.factory.createSchema({ type: ast.schemaTypes.enum, enumValues: [name] }),
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
      ast.factory.createProperty({ name: 'kind', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.enum, enumValues: values }) })
    const node = ast.factory.createSchema({
      type: ast.schemaTypes.intersection,
      members: [
        ast.factory.createSchema({
          type: ast.schemaTypes.union,
          strategy: 'one',
          discriminatorPropertyName: 'kind',
          members: ['a', 'b'].map((name) =>
            ast.factory.createSchema({
              type: ast.schemaTypes.object,
              properties: [
                kind([name]),
                ast.factory.createProperty({ name, required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) }),
              ],
            }),
          ),
        }),
        ast.factory.createSchema({ type: ast.schemaTypes.object, properties: [kind(['a', 'b'])] }),
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
        type: ast.schemaTypes.object,
        properties: [ast.factory.createProperty({ name, required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) })],
      }),
    )
    const node = ast.factory.createSchema({
      type: ast.schemaTypes.intersection,
      members: [
        ast.factory.createSchema({
          type: ast.schemaTypes.union,
          strategy: 'one',
          members: variants.map((schema, index) =>
            references ? ast.factory.createSchema({ type: ast.schemaTypes.ref, name: `variant${index}`, schema }) : schema,
          ),
        }),
        ast.factory.createSchema({
          type: ast.schemaTypes.object,
          properties: [ast.factory.createProperty({ name: 'shared', required: true, schema: ast.factory.createSchema({ type: ast.schemaTypes.string }) })],
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
})
