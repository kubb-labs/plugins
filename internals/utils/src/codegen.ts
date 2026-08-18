import { isIdentifier } from './reserved.ts'
import { singleQuote } from './strings.ts'

const INDENT = '  '

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
 * How much of each OpenAPI description reaches a generated comment block.
 */
export type CommentLevel = 'full' | 'brief' | 'none'

// A whole sentence is worth a few characters over the cap, so the sentence limit sits above the
// cut. Only a description that never finishes a sentence gets cut.
const BRIEF_MAX_LENGTH = 120
const BRIEF_SENTENCE_MAX_LENGTH = 150

const DESCRIPTION_TAG = '@description '

/**
 * Trims a comment list down to the requested level. `'brief'` keeps every tag and shortens only
 * `@description`, since specs routinely put several paragraphs there and the first sentence is
 * the part that helps at a call site.
 */
export function applyCommentLevel(comments: Array<string>, level: CommentLevel): Array<string> {
  if (level === 'none') return []
  if (level === 'full') return comments

  return comments.map((comment) => {
    if (!comment.startsWith(DESCRIPTION_TAG)) return comment

    return `${DESCRIPTION_TAG}${toFirstSentence(comment.slice(DESCRIPTION_TAG.length))}`
  })
}

// Without these, "The role of the message (e.g. `system`)" gets cut to "The role of the
// message (e.g.", losing the content and leaving a bracket open.
const ABBREVIATIONS = new Set(['e.g.', 'i.e.', 'etc.', 'vs.', 'cf.', 'approx.', 'inc.', 'no.', 'dr.', 'mr.', 'mrs.', 'ms.', 'st.', 'fig.', 'al.'])

function toFirstSentence(text: string): string {
  const firstSentence = findFirstSentence(text) ?? text

  if (firstSentence.length <= BRIEF_SENTENCE_MAX_LENGTH) return firstSentence

  const capped = firstSentence.slice(0, BRIEF_MAX_LENGTH)
  const lastSpace = capped.lastIndexOf(' ')

  return `${dropDanglingMarkup(lastSpace > 0 ? capped.slice(0, lastSpace) : capped).trimEnd()}…`
}

// A word boundary still lands inside a markdown link or a code span often enough to matter, leaving
// `[label` or a lone backtick that renders as broken markup on hover. Back up to before it opened.
function dropDanglingMarkup(text: string): string {
  const ticks = [...text.matchAll(/`/g)]
  const cuts = [
    firstUnclosed({ text, open: '(', close: ')' }),
    firstUnclosed({ text, open: '[', close: ']' }),
    ticks.length % 2 === 1 ? (ticks.at(-1)?.index ?? -1) : -1,
  ].filter((index) => index !== -1)

  return text.slice(0, Math.min(...cuts, text.length))
}

function firstUnclosed({ text, open, close }: { text: string; open: string; close: string }): number {
  const stack: Array<number> = []

  for (let index = 0; index < text.length; index++) {
    if (text[index] === open) stack.push(index)
    if (text[index] === close) stack.pop()
  }

  return stack[0] ?? -1
}

function findFirstSentence(text: string): string | null {
  const pattern = /\.(\s|$)/g

  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    if (match.index >= BRIEF_SENTENCE_MAX_LENGTH) return null

    const head = text.slice(0, match.index + 1)
    if (endsSentence(head)) return head
  }

  return null
}

function endsSentence(head: string): boolean {
  const lastWord = head.split(/\s/).pop() ?? ''
  if (ABBREVIATIONS.has(lastWord.replace(/^[^\w]+/, '').toLowerCase())) return false

  return head.split('(').length <= head.split(')').length
}

/**
 * Indents every non-empty line of `text` by one indent level, leaving blank lines empty.
 */
function indentLines(text: string): string {
  if (!text) return ''
  return text
    .split('\n')
    .map((line) => (line.trim() ? `${INDENT}${line}` : ''))
    .join('\n')
}

/**
 * Renders an object key, quoting it with single quotes only when it is not a valid identifier.
 * Reserved words and globals (`name`, `class`, …) are valid bare keys and stay unquoted.
 *
 * @example
 * ```ts
 * objectKey('name')    // 'name'
 * objectKey('x-total') // "'x-total'"
 * ```
 */
export function objectKey(name: string): string {
  return isIdentifier(name) ? name : singleQuote(name)
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
  const body = entries.map((entry) => `${indentLines(entry)},`).join('\n')

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
  const body = items.map((item) => `${indentLines(item)},`).join('\n')

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
