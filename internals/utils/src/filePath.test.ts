import { describe, expect, test } from 'vitest'
import { toFilePath } from './fs.ts'

describe('toFilePath', () => {
  test.each([
    // Security: leading dots must NOT produce a leading slash (path traversal guard)
    ['..Schema', 'schema'],
    ['...Schema', 'schema'],
    ['.Internal', 'internal'],
  ])('toFilePath(%s) -> %s (camelCase segments)', (input, expected) => {
    expect(toFilePath(input)).toBe(expected)
  })
})
