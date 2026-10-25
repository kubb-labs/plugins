import { adapterOas } from '@kubb/adapter-oas'
import { ast } from 'kubb/kit'
import { describe, expect, test } from 'vitest'
import z from 'zod'
import * as zMini from 'zod/mini'
import { printerFaker } from '../../../plugin-faker/src/printers/printerFaker.ts'
import { resolverFaker } from '../../../plugin-faker/src/resolvers/resolverFaker.ts'
import { printerTs } from '../../../plugin-ts/src/printers/printerTs.ts'
import { resolverTs } from '../../../plugin-ts/src/resolvers/resolverTs.ts'
import { printerZod } from './printerZod.ts'
import { printerZodMini } from './printerZodMini.ts'

const cases = [
  { value: [1, 2, 3, 'foo', true], type: "[1, 2, 3, 'foo', true]", invalid: [1, 2, 3, 'bar', true] },
  { value: { foo: 1, bar: true, baz: 'grault' }, type: "{\n  foo: 1;\n  bar: true;\n  baz: 'grault';\n}", invalid: { foo: 2, bar: true, baz: 'grault' } },
  { value: [], type: '[]', invalid: [1] },
  { value: {}, type: '{}', invalid: { extra: true } },
  {
    value: { 'a-b': [null, { nested: "it's quoted" }, []] },
    type: "{\n  'a-b': [null, {\n    nested: 'it\\'s quoted';\n  }, []];\n}",
    invalid: { 'a-b': [null, { nested: 'changed' }, []] },
  },
]

describe('OpenAPI structural const values', () => {
  test.each(cases)('preserves $value across the printers', async ({ value, type, invalid }) => {
    const input = await adapterOas({ validate: false }).parse({
      type: 'data',
      data: {
        openapi: '3.1.1',
        info: { title: 'const', version: '1' },
        paths: {},
        components: { schemas: { Foo: { type: 'object', properties: { value: { const: value } } } } },
      },
    })
    const foo = input.schemas.find((schema) => schema.name === 'Foo')
    const object = foo && ast.narrowSchema(foo, 'object')
    const node = object?.properties[0]?.schema
    expect(node).toBeDefined()
    if (!node) throw new Error('Missing const property')

    const ts = printerTs({
      resolver: resolverTs,
      optionalType: 'questionToken',
      arrayType: 'array',
      enum: { type: 'asConst', constCasing: 'camelCase', typeSuffix: 'Key', keyCasing: 'none' },
    })
    expect(ts.print(node)).toBe(type)
    expect(printerFaker({ resolver: resolverFaker, typeName: 'Foo["value"]' }).print(node)).toBe(JSON.stringify(value))

    for (const [printer, api] of [
      [printerZod({}), z],
      [printerZodMini({}), zMini],
    ] as const) {
      const source = printer.print(node)
      expect(source).toBeTruthy()
      const schema = new Function('z', `return ${source}`)(api) as z.ZodType
      expect(schema.safeParse(value).success).toBe(true)
      expect(schema.safeParse(invalid).success).toBe(false)
      expect(schema.safeParse(undefined).success).toBe(true)
    }
  })
})
