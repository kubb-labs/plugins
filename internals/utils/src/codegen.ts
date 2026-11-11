import { code } from '@kubb/kit'

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
  const body = entries.map((entry) => `${code.indent(entry)},`).join('\n')

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
  const body = items.map((item) => `${code.indent(item)},`).join('\n')

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
  return `get ${code.key(name)}() { return ${body} }`
}
