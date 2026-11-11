import { describe, expect, it } from 'vitest'
import { buildJSDoc, buildList, toLiteral } from './codegen.ts'

describe('buildJSDoc', () => {
  it('returns the fallback when there are no comments', () => {
    expect(buildJSDoc([])).toBe('  ')
    expect(buildJSDoc([], { fallback: '' })).toBe('')
  })
})

describe('buildList', () => {
  it('uses custom brackets', () => {
    expect(buildList(['a', 'b'], ['(', ')'])).toMatchInlineSnapshot(`"(a, b)"`)
  })
})

describe('toLiteral', () => {
  it('prints strings single-quoted, quotes non-identifier keys, and keeps other values as is', () => {
    expect(toLiteral({ id: 1, 'x-tag': ["o'k", null, true] })).toBe("{ id: 1, 'x-tag': ['o\\'k', null, true] }")
  })
})
