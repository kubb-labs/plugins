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

  it('adds the u flag to a literal that uses a Unicode property escape', () => {
    expect(toRegExpString('^[\\p{L}][\\p{L} -]{0,99}$', null)).toBe('/^[\\p{L}][\\p{L} -]{0,99}$/u')
  })

  it('adds the u flag for \\P{...} and \\u{...} and keeps inline flags', () => {
    expect(toRegExpString('^(?i)\\P{L}', null)).toBe('/^\\P{L}/iu')
    expect(toRegExpString('\\u{1F600}')).toBe('new RegExp("\\\\u{1F600}", "u")')
  })

  it('leaves a literal backslash followed by p{ without the u flag', () => {
    expect(toRegExpString('a\\\\p{2}', null)).toBe('/a\\\\p{2}/')
  })

  it('drops an escape the u flag rejects instead of giving up on the flag', () => {
    expect(toRegExpString('\\p{L}\\-', null)).toBe('/\\p{L}-/u')
  })

  it('keeps the original flags when the pattern is not valid under u', () => {
    expect(toRegExpString('\\p{L}+{', null)).toBe('/\\p{L}+{/')
  })
})

describe('toRegExpString on real patterns', () => {
  const cases: Array<{ name: string; pattern: string; yes: Array<string>; no: Array<string>; unicode: boolean }> = [
    { name: 'email', pattern: '^[^@\\s]+@[^@\\s]+\\.[a-z]{2,}$', yes: ['a@b.co'], no: ['ab.co'], unicode: false },
    { name: 'escaped slash', pattern: '^\\/api\\/v1$', yes: ['/api/v1'], no: ['/api/v2'], unicode: false },
    { name: 'inline i flag', pattern: '^(?i)abc$', yes: ['ABC'], no: ['abd'], unicode: false },
    { name: 'lookahead', pattern: '^(?=.*\\d)(?=.*[a-z]).{6,}$', yes: ['abc123'], no: ['abcdef'], unicode: false },
    { name: 'named group', pattern: '^(?<year>\\d{4})-(?<m>\\d{2})$', yes: ['2026-10'], no: ['26-10'], unicode: false },
    { name: 'four digit unicode escape', pattern: '^\\u00e9$', yes: ['é'], no: ['e'], unicode: false },
    { name: 'letters and marks', pattern: "^[\\p{L}\\p{M}' -]+$", yes: ['José', "O'Neil", 'Łukasz'], no: ['a1'], unicode: true },
    { name: 'negated property', pattern: '^\\P{L}+$', yes: ['123'], no: ['abc'], unicode: true },
    { name: 'script property', pattern: '^\\p{Script=Greek}+$', yes: ['αβγ'], no: ['abc'], unicode: true },
    { name: 'inline i flag with a property', pattern: '^(?i)\\p{Lu}$', yes: ['a', 'A'], no: ['1'], unicode: true },
    { name: 'code point escape', pattern: '^\\u{1F600}$', yes: ['😀'], no: ['a'], unicode: true },
    { name: 'property with an escaped dash outside a class', pattern: '^\\p{L}+\\-\\p{L}+$', yes: ['ab-cd'], no: ['ab'], unicode: true },
    { name: 'property with escaped punctuation', pattern: "^\\p{L}+\\'\\ \\@\\_\\p{L}+$", yes: ["ab' @_cd"], no: ['ab'], unicode: true },
    { name: 'property with an escaped dash in a class', pattern: '^[\\p{L}\\-\\.]+$', yes: ['a-b.c'], no: ['1'], unicode: true },
    { name: 'astral character in a class', pattern: '^[😀]$', yes: ['😀'], no: ['a'], unicode: true },
  ]

  for (const { name, pattern, yes, no, unicode } of cases) {
    it(`${name}: the literal and the constructor behave the same`, () => {
      for (const func of [null, 'RegExp']) {
        const regexp = new Function(`return ${toRegExpString(pattern, func)}`)() as RegExp

        expect(regexp.flags.includes('u')).toBe(unicode)
        for (const text of yes) expect(regexp.test(text)).toBe(true)
        for (const text of no) expect(regexp.test(text)).toBe(false)
      }
    })
  }
})

describe('getNestedAccessor', () => {
  it('renders an optional-chaining accessor from a dotted path', () => {
    expect(getNestedAccessor('pagination.next.id', 'lastPage')).toBe("lastPage?.['pagination']?.['next']?.['id']")
  })

  it('returns null for an empty path', () => {
    expect(getNestedAccessor('', 'root')).toBeNull()
  })
})
