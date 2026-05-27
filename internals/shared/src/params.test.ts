import { describe, expect, test } from 'vitest'
import { buildParamsMapping, buildTransformedParamsMapping } from './params.ts'

describe('buildParamsMapping', () => {
  test('returns undefined when names did not change', () => {
    expect(buildParamsMapping([{ name: 'petId' }], [{ name: 'petId' }])).toBeNull()
  })

  test('returns original to mapped names when at least one name changed', () => {
    expect(buildParamsMapping([{ name: 'pet-id' }, { name: 'limit' }], [{ name: 'petId' }, { name: 'limit' }])).toMatchInlineSnapshot(`
      {
        "limit": "limit",
        "pet-id": "petId",
      }
    `)
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
