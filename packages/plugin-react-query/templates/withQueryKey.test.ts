import { describe, expect, it } from 'vitest'
import { withQueryKey } from './withQueryKey.ts'

describe('withQueryKey', () => {
  it('adds queryKey without writing to the query result', () => {
    const query = { data: 1, status: 'success' }
    const result = withQueryKey(query, ['pets'])

    expect(result).toEqual({ queryKey: ['pets'], data: 1, status: 'success' })
    expect(query).not.toHaveProperty('queryKey')
  })

  it('reads each property from the query result when it is accessed', () => {
    const reads: Array<string | symbol> = []
    const query = new Proxy({ data: 1, isFetching: false }, { get: (target, key) => (reads.push(key), Reflect.get(target, key)) })
    const result = withQueryKey(query, ['pets'])

    expect(reads).toEqual([])
    expect(result.data).toBe(1)
    expect(reads).toEqual(['data'])
  })
})
