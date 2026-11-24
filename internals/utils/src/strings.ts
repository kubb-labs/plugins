import { Diagnostics, text } from '@kubb/kit'

// `\p{`, `\P{` or `\u{` behind an odd number of backslashes, or a character outside the BMP: both need the `u` flag.
const NEEDS_UNICODE = /(?<!\\)(?:\\\\)*\\[pPu]\{|[\u{10000}-\u{10FFFF}]/u
// Escapes the `u` flag accepts. `\-` only counts inside a class.
const KEPT_ESCAPE = /[A-Za-z0-9^$\\.*+?()[\]{}|/]/

/**
 * Drops the backslash from escapes that the `u` flag rejects: an escaped punctuation character that is
 * not a syntax character, and `\-` outside a class. Both match the same character without the backslash.
 */
function dropIdentityEscapes(pattern: string): string {
  let inClass = false

  return pattern.replace(/\\(.)|[[\]]/gs, (match, escaped?: string) => {
    if (escaped === undefined) {
      inClass = match === '['
      return match
    }

    return KEPT_ESCAPE.test(escaped) || (escaped === '-' && inClass) ? match : escaped
  })
}

/**
 * Builds the `RegExp` for a pattern, adding the `u` flag when it uses `\p{...}`, `\P{...}` or `\u{...}`, or
 * holds a character outside the BMP. A pattern that is not valid under `u` keeps the flags it came with.
 */
function toRegExp(pattern: string, flags: string | undefined): RegExp {
  if (flags?.includes('u') || !NEEDS_UNICODE.test(pattern)) return new RegExp(pattern, flags)

  try {
    return new RegExp(dropIdentityEscapes(pattern), `${flags ?? ''}u`)
  } catch {
    return new RegExp(pattern, flags)
  }
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
export function toRegExpString(pattern: string, func: string | null = 'RegExp'): string {
  const raw = text.unquote(pattern)

  const match = raw.match(/^\^(\(\?([igmsuy]+)\))/i)
  const replacementTarget = match?.[1] ?? ''
  const matchedFlags = match?.[2]
  const cleaned = raw
    .replace(/^\\?\//, '')
    .replace(/\\?\/$/, '')
    .replace(replacementTarget, '')

  const { source, flags } = (() => {
    try {
      return toRegExp(cleaned, matchedFlags)
    } catch (error) {
      // A spec `pattern` in another regex dialect would otherwise surface as a bare `SyntaxError` with no hint of its origin.
      throw new Diagnostics.Error({
        code: Diagnostics.code.invalidSpec,
        severity: 'error',
        message: `The pattern ${JSON.stringify(raw)} is not a valid JavaScript regular expression.`,
        help: 'Rewrite the `pattern` in ECMAScript syntax. Inline flags such as `(?i)` are only read at the start, as `^(?i)`.',
        cause: error instanceof Error ? error : undefined,
      })
    }
  })()

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
  return `${accessor}${parts.map((part) => `?.[${text.quote(part)}]`).join('')}`
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

// Escapes the literal segments of an OpenAPI path for a template literal, and keeps the `{param}` placeholders.
export function templatePathEscape(path: string): string {
  return path
    .split(/(\{[^}]+\})/)
    .map((part, index) => (index % 2 === 0 ? part.replace(/[\\`$]/g, '\\$&') : part))
    .join('')
}
