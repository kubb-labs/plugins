import { describe, expect, test } from 'vitest'
import { defaultBodySerializer as axiosBodySerializer } from '../../plugin-axios/templates/serializers.ts'
import { defaultBodySerializer as fetchBodySerializer } from './serializers.ts'

describe.each([
  ['fetch', fetchBodySerializer],
  ['axios', axiosBodySerializer],
] as const)('%s urlencoded body serialization', (_, serialize) => {
  test('uses query defaults without encoding metadata', () => {
    const result = serialize({
      body: { d: new Date(0), o: { a: 1 }, arr: ['x', 'y'], nil: null, missing: undefined, zero: 0, flag: false, text: 'a b' },
      contentType: 'application/x-www-form-urlencoded',
    })

    expect(result).toBeInstanceOf(URLSearchParams)
    expect(result?.toString()).toBe('d=1970-01-01T00%3A00%3A00.000Z&o%5Ba%5D=1&arr=x&arr=y&zero=0&flag=false&text=a+b')
  })

  test('omits null and undefined properties', () => {
    const result = serialize({ body: { tags: null, x: undefined }, contentType: 'application/x-www-form-urlencoded' })

    expect(result?.toString()).toBe('')
  })
})
