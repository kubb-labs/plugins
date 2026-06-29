import { describe, expect, it, test } from 'vitest'
import { ast } from '@kubb/core'
import { buildParamsMapping, buildTransformedParamsMapping, caseParams, dedupeByCasedName } from './params.ts'

const { createParameter, createSchema } = ast.factory

const param = (name: string) =>
  createParameter({
    name,
    in: 'query',
    required: false,
    schema: createSchema({ type: 'string' }),
  })

describe('dedupeByCasedName', () => {
  it('drops params that collapse to the same camelCased name, keeping the first', () => {
    const result = dedupeByCasedName([param('max-uploads'), param('prefix'), param('MaxUploads')])

    expect(result.map((p) => p.name)).toStrictEqual(['max-uploads', 'prefix'])
  })

  it('keeps params whose camelCased names are distinct', () => {
    const result = dedupeByCasedName([param('key-marker'), param('upload-id-marker')])

    expect(result.map((p) => p.name)).toStrictEqual(['key-marker', 'upload-id-marker'])
  })

  it('handles an empty params array', () => {
    expect(dedupeByCasedName([])).toStrictEqual([])
  })
})

describe('buildParamsMapping', () => {
  test('returns undefined when names did not change', () => {
    expect(buildParamsMapping([{ name: 'petId' }], [{ name: 'petId' }])).toBeNull()
  })

  test('returns original to mapped names when at least one name changed', () => {
    expect(buildParamsMapping([{ name: 'pet-id' }, { name: 'limit' }], [{ name: 'petId' }, { name: 'limit' }])).toStrictEqual({
      'pet-id': 'petId',
      limit: 'limit',
    })
  })
})

describe('buildTransformedParamsMapping', () => {
  test('returns undefined for empty params', () => {
    expect(buildTransformedParamsMapping([], (name) => name.toUpperCase())).toBeNull()
  })

  test('maps params through the provided transform', () => {
    expect(buildTransformedParamsMapping([{ name: 'pet-id' }], (name) => name.replace('-', ''))).toStrictEqual({
      'pet-id': 'petid',
    })
  })
})

describe('caseParams', () => {
  it('returns original array when casing is undefined', () => {
    const params = [param('pet_id'), param('order_status')]
    const result = caseParams(params, undefined)

    expect(result).toBe(params)
  })

  it('camelCases snake_case names', () => {
    const result = caseParams([param('pet_id'), param('order_status')], 'camelcase')

    expect(result.map((p) => p.name)).toStrictEqual(['petId', 'orderStatus'])
  })

  it('camelCases kebab-case names', () => {
    const result = caseParams([param('some-param'), param('another-one')], 'camelcase')

    expect(result.map((p) => p.name)).toStrictEqual(['someParam', 'anotherOne'])
  })

  it('leaves already-camelCased names unchanged', () => {
    const result = caseParams([param('petId'), param('limit')], 'camelcase')

    expect(result.map((p) => p.name)).toStrictEqual(['petId', 'limit'])
  })

  it('does not mutate the original params', () => {
    const original = [param('pet_id')]
    caseParams(original, 'camelcase')

    expect(original[0]!.name).toBe('pet_id')
  })

  it('preserves all other ParameterNode fields', () => {
    const original = param('pet_id')
    const [result] = caseParams([original], 'camelcase')

    expect(result).toMatchObject({
      kind: 'Parameter',
      in: 'query',
      required: false,
      name: 'petId',
    })
    expect(result!.schema).toBe(original.schema)
  })

  it('handles an empty params array', () => {
    expect(caseParams([], 'camelcase')).toStrictEqual([])
  })
})
