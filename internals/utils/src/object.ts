import { trimQuotes } from './string.ts'

/**
 * Serializes a primitive value to a JSON string literal, stripping any surrounding quote characters first.
 *
 * @example
 * stringify('hello')   // '"hello"'
 * stringify('"hello"') // '"hello"'
 */
export function stringify(value: string | number | boolean | undefined): string {
  if (value === undefined || value === null) return '""'
  return JSON.stringify(trimQuotes(value.toString()))
}

/**
 * Converts a plain object into a multiline key-value string suitable for embedding in generated code.
 * Nested objects are recursively stringified with indentation.
 *
 * @example
 * stringifyObject({ foo: 'bar', nested: { a: 1 } })
 * // 'foo: bar,\nnested: {\n        a: 1\n      }'
 */
export function stringifyObject(value: Record<string, unknown>): string {
  const items = Object.entries(value)
    .map(([key, val]) => {
      if (val !== null && typeof val === 'object') {
        return `${key}: {\n        ${stringifyObject(val as Record<string, unknown>)}\n      }`
      }
      return `${key}: ${val}`
    })
    .filter(Boolean)
  return items.join(',\n')
}

/**
 * Converts a dot-notation path or string array into an optional-chaining accessor expression.
 *
 * @example
 * getNestedAccessor('pagination.next.id', 'lastPage')
 * // → "lastPage?.['pagination']?.['next']?.['id']"
 */
export function getNestedAccessor(param: string | string[], accessor: string): string | null {
  const parts = Array.isArray(param) ? param : param.split('.')
  if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) return null
  return `${accessor}?.['${`${parts.join("']?.['")}']`}`
}
