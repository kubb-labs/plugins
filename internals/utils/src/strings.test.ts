import { describe, expect, it } from 'vitest'
import { getNestedAccessor, jsDocEscape, jsStringEscape, stringify, toRegExpString, trimQuotes } from './strings.ts'

describe('trimQuotes', () => {
  it('strips a balanced double-quote pair', () => {
    expect(trimQuotes('"hello"')).toBe('hello')
  })

  it('leaves an unquoted string unchanged', () => {
    expect(trimQuotes('hello')).toBe('hello')
  })

  it('leaves a mismatched pair unchanged', () => {
    expect(trimQuotes('"hello\'')).toBe('"hello\'')
  })
})

describe('stringify', () => {
  it('wraps a plain string in single quotes', () => {
    expect(stringify('hello')).toBe("'hello'")
  })

  it('strips existing surrounding quotes first', () => {
    expect(stringify('"hello"')).toBe("'hello'")
  })

  it('escapes an embedded single quote', () => {
    expect(stringify("o'clock")).toBe("'o\\'clock'")
  })

  it('escapes a newline', () => {
    expect(stringify('a\nb')).toBe("'a\\nb'")
  })

  it('serializes numbers, booleans, and undefined', () => {
    expect(stringify(42)).toBe("'42'")
    expect(stringify(true)).toBe("'true'")
    expect(stringify(undefined)).toBe("''")
  })
})

describe('jsDocEscape', () => {
  it('escapes an @ that starts a line and keeps the rest', () => {
    expect(jsDocEscape('intro\n  @example value\nmail me@example.com')).toBe('intro\n  \\@example value\nmail me@example.com')
  })
})

describe('jsStringEscape', () => {
  it('escapes quotes and backslashes', () => {
    expect(jsStringEscape('say "hi"')).toBe('say \\"hi\\"')
    expect(jsStringEscape("o'clock")).toBe("o\\'clock")
    expect(jsStringEscape('a\\b')).toBe('a\\\\b')
  })

  it('escapes line terminators', () => {
    expect(jsStringEscape('a\nb\rc')).toBe('a\\nb\\rc')
    expect(jsStringEscape('a\u2028b\u2029c')).toBe('a\\u2028b\\u2029c')
  })
})

describe('toRegExpString', () => {
  it('renders a RegExp constructor call', () => {
    expect(toRegExpString('foo')).toBe('new RegExp("foo")')
  })

  it('extracts inline flags into a second argument', () => {
    expect(toRegExpString('^(?im)foo')).toBe('new RegExp("^foo", "im")')
  })

  it('renders a regex literal when func is null', () => {
    expect(toRegExpString('^(?im)foo', null)).toBe('/^foo/im')
  })

  it('strips surrounding quotes before parsing', () => {
    expect(toRegExpString('"foo"')).toBe('new RegExp("foo")')
  })
})

describe('getNestedAccessor', () => {
  it('renders an optional-chaining accessor from a dotted path', () => {
    expect(getNestedAccessor('pagination.next.id', 'lastPage')).toBe("lastPage?.['pagination']?.['next']?.['id']")
  })

  it('returns null for an empty path', () => {
    expect(getNestedAccessor('', 'root')).toBeNull()
  })
})
