import { describe, expect, test } from 'vitest'
import { jsStringEscape, trimExtName, trimQuotes } from './string.ts'

describe('jsStringEscape', () => {
  test('return jsStringEscape text', () => {
    expect(jsStringEscape('"Hello World!"')).toMatchInlineSnapshot(`"\\"Hello World!\\""`)
    expect(jsStringEscape("HTTP Status'")).toMatchInlineSnapshot(`"HTTP Status\\'"`)
    expect(jsStringEscape(null)).toMatchInlineSnapshot(`"null"`)
    expect(jsStringEscape(undefined)).toMatchInlineSnapshot(`"undefined"`)
    expect(jsStringEscape(false)).toMatchInlineSnapshot(`"false"`)
    expect(jsStringEscape(0.0)).toMatchInlineSnapshot(`"0"`)
    expect(jsStringEscape({})).toMatchInlineSnapshot(`"[object Object]"`)
    expect(jsStringEscape('')).toMatchInlineSnapshot(`""`)
  })

  test('handles line terminators', () => {
    expect(jsStringEscape('line1\nline2')).toBe('line1\\nline2')
    expect(jsStringEscape('line1\rline2')).toBe('line1\\rline2')
    expect(jsStringEscape('line1\u2028line2')).toBe('line1\\u2028line2')
    expect(jsStringEscape('line1\u2029line2')).toBe('line1\\u2029line2')
  })

  test('handles backslash', () => {
    expect(jsStringEscape('path\\to\\file')).toBe('path\\\\to\\\\file')
  })
})

describe('trimQuotes', () => {
  test('should remove double quotes', () => {
    expect(trimQuotes('"test"')).toBe('test')
  })

  test('should remove single quotes', () => {
    expect(trimQuotes("'test'")).toBe('test')
  })

  test('should remove backticks', () => {
    expect(trimQuotes('`test`')).toBe('test')
  })

  test('should return text as-is if no quotes', () => {
    expect(trimQuotes('test')).toBe('test')
  })
})

describe('trimExtName', () => {
  test('strips .ts extension', () => {
    expect(trimExtName('petStore.ts')).toBe('petStore')
  })

  test('strips extension from a full path', () => {
    expect(trimExtName('/src/models/pet.ts')).toBe('/src/models/pet')
  })

  test('does not strip the dot from a directory segment', () => {
    expect(trimExtName('/project.v2/gen/pet.ts')).toBe('/project.v2/gen/pet')
  })

  test('returns the input unchanged when there is no extension', () => {
    expect(trimExtName('noExtension')).toBe('noExtension')
  })

  test('strips .json extension', () => {
    expect(trimExtName('schema.json')).toBe('schema')
  })

  test('strips double extension (.d.ts)', () => {
    expect(trimExtName('types.d.ts')).toBe('types.d')
  })
})
