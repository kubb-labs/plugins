import { describe, expect, it } from 'vitest'
import { buildJSDoc, buildList } from './codegen.ts'

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
