import { text } from '@kubb/kit'
import { isIdentifier } from './reserved.ts'

/**
 * Builds a JSDoc comment block from an array of lines. Returns `fallback` when there are no
 * comments.
 *
 * @example
 * ```ts
 * buildJSDoc(['@type string', '@example hello'])
 * // '/**\n   * @type string\n   * @example hello\n   *\/\n  '
 * ```
 */
export function buildJSDoc(
  comments: Array<string>,
  options: {
    /**
     * String used to indent each comment line.
     * @default '   * '
     */
    indent?: string
    /**
     * String appended after the closing tag.
     * @default '\n  '
     */
    suffix?: string
    /**
     * Returned as-is when `comments` is empty.
     * @default '  '
     */
    fallback?: string
  } = {},
): string {
  const { indent = '   * ', suffix = '\n  ', fallback = '  ' } = options

  if (comments.length === 0) return fallback

  return `/**\n${comments.map((c) => `${indent}${c}`).join('\n')}\n   */${suffix}`
}

/**
 * Assembles a multi-line object literal from already-rendered `entries`, indenting each entry one
 * level and closing the brace at column zero. Entries that are themselves multi-line objects indent
 * cumulatively. Each entry ends with a trailing comma to match the formatter's multi-line style.
 *
 * @example
 * ```ts
 * buildObject(['id: z.number()', 'name: z.string()'])
 * // '{\n  id: z.number(),\n  name: z.string(),\n}'
 * ```
 */
export function buildObject(entries: Array<string>): string {
  if (entries.length === 0) return '{}'
  const body = entries.map((entry) => `${text.indent({ text: entry })},`).join('\n')

  return `{\n${body}\n}`
}

/**
 * Assembles a bracketed list (array by default) from already-rendered `items`. Keeps everything on
 * one line when no item spans multiple lines, and otherwise puts each item on its own line, indented
 * one level with a trailing comma and the closing bracket at column zero. Used for member lists such
 * as `z.union([…])` and `z.array([…])`.
 *
 * @example
 * ```ts
 * buildList(['z.string()', 'z.number()'])
 * // '[z.string(), z.number()]'
 * ```
 */
export function buildList(items: Array<string>, brackets: [open: string, close: string] = ['[', ']']): string {
  const [open, close] = brackets
  if (items.length === 0) return `${open}${close}`
  if (!items.some((item) => item.includes('\n'))) return `${open}${items.join(', ')}${close}`
  const body = items.map((item) => `${text.indent({ text: item })},`).join('\n')

  return `${open}\n${body}\n${close}`
}

/**
 * Emits a lazy getter for a circular-ref property position, `get name() { return body }`. The key
 * is quoted only when it is not a valid identifier. Used by the string printers to defer evaluation
 * of a recursive schema until first access.
 *
 * @example
 * ```ts
 * lazyGetter({ name: 'parent', body: 'z.lazy(() => Pet)' })
 * // "get parent() { return z.lazy(() => Pet) }"
 * ```
 */
export function lazyGetter({ name, body }: { name: string; body: string }): string {
  return `get ${objectKey(name)}() { return ${body} }`
}

/**
 * An object key, quoted only when it is not identifier-shaped. Reserved words such as `class` stay bare.
 *
 * @example
 * ```ts
 * objectKey('x-total') // "'x-total'"
 * ```
 */
export function objectKey(name: string): string {
  return isIdentifier(name) ? name : text.quote(name)
}

/**
 * A JSON value as a JavaScript literal, with single-quoted strings and identifier keys left unquoted.
 *
 * @example
 * ```ts
 * toLiteral({ id: 1, 'x-tag': ['a'] }) // "{ id: 1, 'x-tag': ['a'] }"
 * ```
 */
export function toLiteral(value: unknown): string {
  if (typeof value === 'string') return text.quote(value)
  if (Array.isArray(value)) return `[${value.map(toLiteral).join(', ')}]`
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value)
      .map(([key, item]) => `${objectKey(key)}: ${toLiteral(item)}`)
      .join(', ')} }`
  }
  return String(value)
}
