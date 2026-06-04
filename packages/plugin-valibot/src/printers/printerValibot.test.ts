import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { printerValibot } from './printerValibot.ts'
import { applyModifiers, formatDefault } from '../utils.ts'

describe('printerValibot', () => {
  const printer = printerValibot({})

  test('prints scalar types', () => {
    expect(printer.print(ast.createSchema({ type: 'any' }))).toBe('v.any()')
    expect(printer.print(ast.createSchema({ type: 'unknown' }))).toBe('v.unknown()')
    expect(printer.print(ast.createSchema({ type: 'void' }))).toBe('v.void()')
    expect(printer.print(ast.createSchema({ type: 'boolean' }))).toBe('v.boolean()')
    expect(printer.print(ast.createSchema({ type: 'null' }))).toBe('v.null()')
  })

  test('prints string constraints as pipe actions', () => {
    expect(printer.print(ast.createSchema({ type: 'string', min: 1, max: 10, pattern: '^[a-z]+$' }))).toBe(
      'v.pipe(v.string(), v.minLength(1), v.maxLength(10), v.regex(/^[a-z]+$/))',
    )
  })

  test('prints number constraints as pipe actions', () => {
    expect(printer.print(ast.createSchema({ type: 'number', min: 0, max: 100, multipleOf: 10 }))).toBe(
      'v.pipe(v.number(), v.minValue(0), v.maxValue(100), v.multipleOf(10))',
    )
  })

  test('prints integer as number with integer action', () => {
    expect(printer.print(ast.createSchema({ type: 'integer' }))).toBe('v.pipe(v.number(), v.integer())')
  })

  test('prints date formats', () => {
    expect(printer.print(ast.createSchema({ type: 'date', representation: 'string' }))).toBe('v.pipe(v.string(), v.isoDate())')
    expect(printer.print(ast.createSchema({ type: 'datetime' }))).toBe('v.pipe(v.string(), v.isoDateTime())')
    expect(printer.print(ast.createSchema({ type: 'time', representation: 'string' }))).toBe('v.pipe(v.string(), v.isoTime())')
  })

  test('prints special string formats', () => {
    expect(printer.print(ast.createSchema({ type: 'uuid' }))).toBe('v.pipe(v.string(), v.uuid())')
    expect(printer.print(ast.createSchema({ type: 'email' }))).toBe('v.pipe(v.string(), v.email())')
    expect(printer.print(ast.createSchema({ type: 'url' }))).toBe('v.pipe(v.string(), v.url())')
  })

  test('prints enum values as picklist', () => {
    expect(printer.print(ast.createSchema({ type: 'enum', enumValues: ['a', 'b', 'c'] }))).toBe('v.picklist(["a", "b", "c"])')
  })

  test('prints object properties and modifiers', () => {
    const node = ast.createSchema({
      type: 'object',
      primitive: 'object',
      properties: [
        ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
        ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ast.createProperty({ name: 'status', schema: ast.createSchema({ type: 'string', optional: true }) }),
      ],
    })

    expect(printer.print(node)).toBe('v.object({\n    "id": v.pipe(v.number(), v.integer()),\n    "name": v.string(),\n    "status": v.optional(v.string())\n    })')
  })

  test('prints additionalProperties as objectWithRest', () => {
    const node = ast.createSchema({ type: 'object', primitive: 'object', properties: [], additionalProperties: ast.createSchema({ type: 'string' }) })
    expect(printer.print(node)).toBe('v.objectWithRest({\n    \n    }, v.string())')
  })

  test('prints union and discriminated union', () => {
    expect(printer.print(ast.createSchema({ type: 'union', members: [ast.createSchema({ type: 'string' }), ast.createSchema({ type: 'number' })] }))).toBe(
      'v.union([v.string(), v.number()])',
    )

    expect(
      printer.print(
        ast.createSchema({
          type: 'union',
          discriminatorPropertyName: 'type',
          members: [ast.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }), ast.createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' })],
        }),
      ),
    ).toBe('v.variant("type", [Cat, Dog])')
  })

  test('prints nullable optional modifiers as nullish', () => {
    expect(printer.print(ast.createSchema({ type: 'string', nullable: true, optional: true }))).toBe('v.nullish(v.string())')
  })

  test('supports exact optional object entries', () => {
    const p = printerValibot({ optionalType: 'exactOptional' })
    expect(p.print(ast.createSchema({ type: 'string', optional: true }))).toBe('v.exactOptional(v.string())')
  })

  test('supports undefinedable object entries', () => {
    const p = printerValibot({ optionalType: 'undefinedable' })
    expect(p.print(ast.createSchema({ type: 'string', optional: true }))).toBe('v.undefinedable(v.string())')
  })

  test('can skip fallback for non-optional defaults', () => {
    const p = printerValibot({ defaultMode: 'default' })
    expect(p.print(ast.createSchema({ type: 'string', default: 'active' }))).toBe('v.string()')
  })

  test('preserves object default literals', () => {
    expect(formatDefault({ foo: 'bar', count: 2 })).toBe('{"foo":"bar","count":2}')
    expect(applyModifiers({ value: 'v.string()', defaultValue: { foo: 'bar' } })).toBe('v.string()')
  })

  test('prints title and examples metadata', () => {
    const p = printerValibot({ metadata: { title: true, examples: true } })
    const node = { ...ast.createSchema({ type: 'string' }), title: 'Pet name', examples: ['Baxter', 'Milo'] } as ast.SchemaNode

    expect(p.print(node)).toBe('v.pipe(v.string(), v.title("Pet name"), v.examples(["Baxter","Milo"]))')
  })

  test('prints readonly action when enabled', () => {
    const p = printerValibot({ readonly: true })
    const node = ast.createSchema({ type: 'string', readOnly: true })

    expect(p.print(node)).toBe('v.pipe(v.string(), v.readonly())')
  })

  test('supports node overrides', () => {
    const customPrinter = printerValibot({ nodes: { date: () => 'v.pipe(v.string(), v.isoTimestamp())' } })
    expect(customPrinter.print(ast.createSchema({ type: 'date', representation: 'string' }))).toBe('v.pipe(v.string(), v.isoTimestamp())')
  })
})
