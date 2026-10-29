import { describe, expect, test } from 'vitest'
import { getCircularNames, getEnumNames } from './meta.ts'

describe('getCircularNames / getEnumNames', () => {
  test('builds each set once per memo and reads the meta names into it', () => {
    const store = new Map<string, unknown>()
    const ctx = {
      memo: (key: string, compute: () => unknown) => store.get(key) ?? store.set(key, compute()).get(key),
      meta: { circularNames: ['Pet'], enumNames: ['Status'] },
    } as unknown as Parameters<typeof getCircularNames>[0]

    const circular = getCircularNames(ctx)
    const enums = getEnumNames(ctx)

    expect(circular.has('Pet')).toBe(true)
    expect(enums.has('Status')).toBe(true)
    expect(getCircularNames(ctx)).toBe(circular)
    expect(getEnumNames(ctx)).toBe(enums)
  })
})
