import { describe, expect, test, vi } from 'vitest'
import { type StandardSchemaResult, toHeadersStandardSchema } from './standardSchema.ts'

/**
 * Stands in for a generated `z.object` headers schema: `X-Tenant` is required and upper-cased by a
 * transform, `X-Since` is optional, and undeclared keys are stripped.
 */
function headersSchema(async = false) {
  const validate = (value: unknown): StandardSchemaResult<unknown> => {
    const input = value as Record<string, unknown>
    if (typeof input['X-Tenant'] !== 'string') return { issues: [{ message: 'Required', path: ['X-Tenant'] }] }
    return { value: { 'X-Tenant': input['X-Tenant'].toUpperCase(), ...(input['X-Since'] === undefined ? {} : { 'X-Since': input['X-Since'] }) } }
  }
  return { '~standard': { validate: async ? async (value: unknown) => validate(value) : validate } }
}

// The declared keys, as `schema.shape` (zod) or `schema.entries` (valibot) would expose them.
const entries = { 'X-Tenant': {}, 'X-Since': {} }

describe('toHeadersStandardSchema', () => {
  test('matches declared headers in any casing and returns them in the casing the caller used', () => {
    const result = toHeadersStandardSchema(headersSchema(), entries)['~standard'].validate({ 'x-tenant': 'acme', 'X-SINCE': '2026' })
    expect(result).toStrictEqual({ value: { 'x-tenant': 'ACME', 'X-SINCE': '2026' } })
  })

  test('passes undeclared headers through untouched', () => {
    const result = toHeadersStandardSchema(headersSchema(), entries)['~standard'].validate({
      'X-Tenant': 'acme',
      Authorization: 'Bearer token',
    })
    expect(result).toStrictEqual({ value: { Authorization: 'Bearer token', 'X-Tenant': 'ACME' } })
  })

  test('reports an issue under the key the caller used', () => {
    const result = toHeadersStandardSchema(headersSchema(), entries)['~standard'].validate({ 'x-tenant': 1 })
    expect(result).toStrictEqual({ issues: [{ message: 'Required', path: ['x-tenant'] }] })
  })

  test.each([undefined, null, 'x-tenant: acme', 42])('rejects %s, which is not an object, without calling the schema', (value) => {
    const validate = vi.fn()
    const schema = toHeadersStandardSchema({ '~standard': { validate } }, entries)
    expect(schema['~standard'].validate(value)).toStrictEqual({ issues: [{ message: 'Expected an object' }] })
    expect(validate).not.toHaveBeenCalled()
  })

  test('uses the spelling given last when one declared header comes in two casings', () => {
    const result = toHeadersStandardSchema(headersSchema(), entries)['~standard'].validate({ 'X-Tenant': 'first', 'x-tenant': 'second' })
    expect(result).toStrictEqual({ value: { 'x-tenant': 'SECOND' } })
  })

  test('reports a missing declared header under its declared name', () => {
    const result = toHeadersStandardSchema(headersSchema(), entries)['~standard'].validate({ 'x-trace': 'abc' })
    expect(result).toStrictEqual({ issues: [{ message: 'Required', path: ['X-Tenant'] }] })
  })

  test('handles an async schema', async () => {
    const result = await toHeadersStandardSchema(headersSchema(true), entries)['~standard'].validate({ 'x-tenant': 'acme' })
    expect(result).toStrictEqual({ value: { 'x-tenant': 'ACME' } })
  })
})
