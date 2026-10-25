/**
 * Wraps a value in single quotes for emitting a single-quoted JavaScript string literal, escaping
 * any backslash or single quote in the content.
 *
 * @example
 * ```ts
 * singleQuote('foo')      // "'foo'"
 * singleQuote("o'clock")  // "'o\\'clock'"
 * ```
 */
export function singleQuote(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return "''"
  const escaped = String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")

  return `'${escaped}'`
}

/**
 * Strips a single matching pair of `"..."`, `'...'`, or `` `...` `` from both ends of `text`.
 * Returns the string unchanged when no balanced quote pair is found.
 *
 * @example
 * ```ts
 * trimQuotes('"hello"') // 'hello'
 * trimQuotes('hello')   // 'hello'
 * ```
 */
export function trimQuotes(text: string): string {
  if (text.length >= 2) {
    const first = text[0]
    const last = text[text.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'") || (first === '`' && last === '`')) {
      return text.slice(1, -1)
    }
  }
  return text
}

/**
 * Serializes a primitive to a single-quoted string literal, stripping any surrounding quotes first.
 *
 * Escaping runs through `JSON.stringify`, then the result switches to single quotes so the generated
 * code matches the repo style without a formatter.
 *
 * @example
 * ```ts
 * stringify('hello')   // "'hello'"
 * stringify('"hello"') // "'hello'"
 * ```
 */
export function stringify(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return "''"
  const json = JSON.stringify(trimQuotes(value.toString()))
  const inner = json.slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")
  return `'${inner}'`
}

/**
 * Escapes an `@` at the start of a line, so a multi-line description can't start a new JSDoc tag.
 * Editors render `\@` as `@` in hovers.
 *
 * @example
 * ```ts
 * jsDocEscape('intro\n@example value') // 'intro\n\\@example value'
 * ```
 */
export function jsDocEscape(input: unknown): string {
  return `${input}`.replace(/^(\s*)@/gm, '$1\\@')
}

/**
 * Escapes characters that are not allowed inside JS string literals, covering quotes, backslashes,
 * and the Unicode line terminators U+2028 and U+2029.
 *
 * @see http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
 *
 * @example
 * ```ts
 * jsStringEscape('say "hi"\nbye') // 'say \\"hi\\"\\nbye'
 * ```
 */
export function jsStringEscape(input: unknown): string {
  return `${input}`.replace(/["'\\\n\r\u2028\u2029]/g, (character) => {
    switch (character) {
      case '"':
      case "'":
      case '\\':
        return `\\${character}`
      case '\n':
        return '\\n'
      case '\r':
        return '\\r'
      case '\u2028':
        return '\\u2028'
      case '\u2029':
        return '\\u2029'
      default:
        return ''
    }
  })
}

// An odd number of backslashes before `p{`, `P{` or `u{` is a Unicode escape that only means something under the `u` flag.
const UNICODE_ESCAPE = /(?<!\\)(?:\\\\)*\\(?:[pP]|u)\{/
// A character outside the BMP is two code units without the `u` flag, so a class holding one never matches it whole.
const ASTRAL_CHARACTER = /[\u{10000}-\u{10FFFF}]/u
// Escapes the `u` flag accepts. `\-` only counts inside a class.
const KEPT_ESCAPE = /[A-Za-z0-9^$\\.*+?()[\]{}|/]/

/**
 * Drops the backslash from escapes that the `u` flag rejects: an escaped punctuation character that is
 * not a syntax character, and `\-` outside a class. Both match the same character without the backslash.
 */
function dropIdentityEscapes(pattern: string): string {
  let result = ''
  let inClass = false

  for (let index = 0; index < pattern.length; index++) {
    const char = pattern[index]!

    if (char === '\\' && index + 1 < pattern.length) {
      const next = pattern[++index]!
      result += KEPT_ESCAPE.test(next) || (next === '-' && inClass) ? `\\${next}` : next
      continue
    }

    if (char === '[') inClass = true
    else if (char === ']') inClass = false
    result += char
  }

  return result
}

/**
 * Builds the `RegExp` for a pattern, adding the `u` flag when it uses `\p{...}`, `\P{...}` or `\u{...}`, or
 * holds a character outside the BMP. A pattern that is not valid under `u` keeps the flags it came with.
 */
function toRegExp(pattern: string, flags: string | undefined): RegExp {
  if (flags?.includes('u') || !(UNICODE_ESCAPE.test(pattern) || ASTRAL_CHARACTER.test(pattern))) return new RegExp(pattern, flags)

  for (const candidate of [pattern, dropIdentityEscapes(pattern)]) {
    try {
      return new RegExp(candidate, `${flags ?? ''}u`)
    } catch {
      // Try the next candidate, then fall back to the original flags.
    }
  }

  return new RegExp(pattern, flags)
}

/**
 * Converts a pattern string into a `new RegExp(...)` constructor call or a regex literal string.
 * Inline flags expressed as a `^(?im)` prefix are extracted and applied to the resulting expression.
 * Pass `null` as the second argument to emit a `/pattern/flags` literal instead.
 *
 * @example
 * ```ts
 * toRegExpString('^(?im)foo')       // 'new RegExp("^foo", "im")'
 * toRegExpString('^(?im)foo', null) // '/^foo/im'
 * ```
 */
export function toRegExpString(text: string, func: string | null = 'RegExp'): string {
  const raw = trimQuotes(text)

  const match = raw.match(/^\^(\(\?([igmsuy]+)\))/i)
  const replacementTarget = match?.[1] ?? ''
  const matchedFlags = match?.[2]
  const cleaned = raw
    .replace(/^\\?\//, '')
    .replace(/\\?\/$/, '')
    .replace(replacementTarget, '')

  const { source, flags } = toRegExp(cleaned, matchedFlags)

  if (func === null) return `/${source}/${flags}`

  return `new ${func}(${JSON.stringify(source)}${flags ? `, ${JSON.stringify(flags)}` : ''})`
}

/**
 * Renders a dotted path or string array as an optional-chaining accessor expression rooted at
 * `accessor`. Returns `null` for an empty path.
 *
 * @example
 * ```ts
 * getNestedAccessor('pagination.next.id', 'lastPage')
 * // "lastPage?.['pagination']?.['next']?.['id']"
 * ```
 */
export function getNestedAccessor(param: string | Array<string>, accessor: string): string | null {
  const parts = Array.isArray(param) ? param : param.split('.')
  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) return null
  return `${accessor}?.['${`${parts.join("']?.['")}']`}`
}
