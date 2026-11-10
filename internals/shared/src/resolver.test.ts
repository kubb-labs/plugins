import type { GeneratorContext } from '@kubb/kit'
import { ast } from '@kubb/kit'
import { describe, expect, test } from 'vitest'
import { getCircularNames } from './resolver.ts'

describe('getCircularNames', () => {
  test('finds a cycle that runs through conditionals', () => {
    const ref = (name: string) => ast.factory.createSchema({ type: 'ref', name, ref: `#/components/schemas/${name}` })
    const object = (properties: Array<ast.PropertyNode>) => ast.factory.createSchema({ type: 'object', properties })
    const order = ast.factory.createSchema({
      type: 'object',
      name: 'Order',
      properties: [],
      conditionals: [{ if: object([]), then: object([ast.factory.createProperty({ name: 'customer', schema: ref('Customer') })]) }],
    })
    const customer = ast.factory.createSchema({
      type: 'object',
      name: 'Customer',
      properties: [ast.factory.createProperty({ name: 'orders', schema: ast.factory.createSchema({ type: 'array', items: [ref('Order')] }) })],
    })
    const ctx = { memo: (_key: string, fn: () => unknown) => fn(), driver: { inputNode: { schemas: [order, customer] } } } as unknown as Pick<
      GeneratorContext,
      'memo' | 'driver'
    >

    expect(getCircularNames(ctx)).toStrictEqual(new Set(['Order', 'Customer']))
  })
})
