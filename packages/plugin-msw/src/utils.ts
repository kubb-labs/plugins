import { isValidVarName, toLiteral } from '@internals/utils'
import { toResponseContent } from '@internals/shared'

import { ast, text } from '@kubb/kit'

// Headers use the `simple` style, so an array or object is sent comma-separated.
function toSimpleStyle(value: unknown): string {
  if (Array.isArray(value)) return value.join(',')
  if (typeof value === 'object' && value !== null) return Object.entries(value).flat().join(',')
  return String(value)
}

/**
 * The declared headers a mock sends, each with its example's `serializedValue` or `value`, else its schema's `default` or first example.
 */
export function getMockHeaders(response: ast.ResponseNode | null | undefined): Array<[name: string, value: string]> {
  return (response?.headers ?? []).flatMap((header): Array<[string, string]> => {
    // OpenAPI ignores a `Content-Type` response header, and the mock already sends one.
    if (header.name.toLowerCase() === 'content-type') return []
    const example = header.examples?.find((entry) => entry.serializedValue !== undefined || entry.value !== undefined)
    const headerValue = example?.serializedValue ?? example?.value ?? header.schema.default ?? header.schema.examples?.[0]
    if (headerValue === undefined || headerValue === null) return []
    const headerText = toSimpleStyle(headerValue)
    // `Headers` throws on a line break or a character above U+00FF, so such an example is left out.
    return /^[\t\x20-\x7E\x80-\xFF]*$/.test(headerText) ? [[header.name, headerText]] : []
  })
}

/**
 * Returns the base URL as source code. A `${...}` value stays a template literal.
 */
export function resolveDefaultBaseURL(baseURL: string | null | undefined): string {
  if (!baseURL) {
    return "''"
  }
  if (baseURL.includes('${')) {
    return `\`${baseURL.replaceAll('`', '\\`')}\``
  }
  return JSON.stringify(baseURL)
}

/**
 * Gets the content type from a response, defaulting to 'application/json' if a schema exists.
 */
export function getContentType(response: ast.ResponseNode | null | undefined): string | null {
  if (!hasResponseSchema(response)) {
    return null
  }

  return getResponseContentType(response) ?? 'application/json'
}

/**
 * Determines if a response has a usable body schema.
 */
export function hasResponseSchema(response: ast.ResponseNode | null | undefined): boolean {
  const schema = response?.content?.find((entry) => entry.schema)?.schema
  return !!schema && schema.type !== 'void' && schema.type !== 'any' && schema.type !== 'unknown'
}

/**
 * Picks the content type used for the mocked response header. When a response declares multiple
 * content types, JSON is preferred (the faker mock body is JSON), otherwise the first declared type.
 */
function getResponseContentType(response: ast.ResponseNode | null | undefined): string | null {
  const contentType = getResponseEntry(response)?.contentType
  return typeof contentType === 'string' && contentType.length > 0 ? contentType : null
}

function getResponseEntry(response: ast.ResponseNode | null | undefined): ast.ContentNode | undefined {
  const contents = response?.content ?? []
  return contents.find((entry) => ast.mediaType.isJson(entry)) ?? contents[0]
}

/**
 * The first content type of a response that the client reads as text, such as `application/xml`, or `null` when none is.
 */
function getTextContentType(response: ast.ResponseNode | null | undefined): string | null {
  const entry = (response?.content ?? []).find((entry) => {
    const schema = toResponseContent(entry, response?.content).schema
    return !ast.mediaType.isJson(entry) && schema && ast.ref.getSchema(schema).primitive === 'string'
  })
  return entry?.contentType ?? null
}

// The client's `jsonReplacer`: a `bigint` goes out as a JSON number, and throws past the safe-integer range instead of losing precision.
const bigintReplacer = `(_key, value) => {
      if (typeof value !== 'bigint') return value
      if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) throw new TypeError(\`Cannot serialize \${value}n as JSON without losing precision.\`)
      return Number(value)
    }`

/**
 * The `JSON.stringify` call for `body`. `JSON.stringify` throws on a `bigint`, so a response with an `int64` field gets a replacer.
 */
function stringify(body: string, response: ast.ResponseNode | null | undefined): string {
  const hasBigint = (response?.content ?? []).some(
    (entry) => entry.schema && ast.schema.find(entry.schema, { predicate: (schema) => schema.type === 'bigint', followRefs: true }) !== undefined,
  )
  return hasBigint ? `JSON.stringify(${body}, ${bigintReplacer})` : `JSON.stringify(${body})`
}

/**
 * The statements that return a mocked `Response` for `body`. A string body for a response the client reads as text goes
 * out as raw text with that content type, so an XML mock is not sent as a quoted JSON string. Any other body is JSON.
 */
export function responseReturn(body: string, status: number, response: ast.ResponseNode | null | undefined): string {
  const contentType = getContentType(response)
  const headers = getMockHeaders(response)
  // A plain variable such as `data` is checked as it is, an expression such as `data ?? createPet()` is read once.
  const name = isValidVarName(body) ? body : 'body'
  const prelude = name === body ? '' : `const body = ${body}\n    `

  // shortcut: one event per mock, upgrade when a mock needs to send several events.
  if (contentType && ast.mediaType.getBase(contentType) === 'text/event-stream') {
    const entry = getResponseEntry(response)
    // Without a body, a spec example already serialized as SSE text goes out as it is.
    const serialized = entry?.examples?.find((example) => example.serializedValue !== undefined)?.serializedValue
    const fallback = serialized === undefined ? "''" : toLiteral(serialized)
    if (entry?.stream?.shape !== 'event') {
      return `${prelude}return ${responseLiteral(`${name} === undefined ? ${fallback} : \`\${${eventDataLines(name, response)}}\\n\\n\``, status, contentType, headers)}`
    }
    // The item is the whole event, so its fields become SSE lines and the client parses it back to the same object.
    return `${prelude}const event = ${name} as { event?: unknown; id?: unknown; retry?: unknown; data?: unknown } | undefined
    const lines = [
      ...(['event', 'id', 'retry'] as const).filter((field) => event?.[field] !== undefined).map((field) => \`\${field}: \${event?.[field]}\`),
      // A client dispatches an event only once it has a \`data\` line, so an event without data still sends an empty one.
      event?.data === undefined ? 'data:' : ${eventDataLines('event.data', response)},
    ]

    return ${responseLiteral(`event === undefined ? ${fallback} : \`\${lines.join('\\n')}\\n\\n\``, status, contentType, headers)}`
  }

  const textContentType = hasResponseSchema(response) ? getTextContentType(response) : null
  if (!textContentType) return `return ${responseLiteral(stringify(body, response), status, contentType, headers)}`

  return `${prelude}if (typeof ${name} === 'string') return ${responseLiteral(name, status, textContentType, headers)}

    return ${responseLiteral(stringify(name, response), status, contentType, headers)}`
}

/**
 * The `data:` lines of one Server-Sent Event. A string goes out as it is, since a client keeps string `data` as text.
 */
function eventDataLines(body: string, response: ast.ResponseNode | null | undefined): string {
  return `(typeof ${body} === 'string' ? ${body} : ${stringify(body, response)}).split('\\n').map((line) => \`data: \${line}\`).join('\\n')`
}

/**
 * The spec example of the response entry the mock sends, as source code, or `null` when that entry has none.
 */
export function getExampleBody(response: ast.ResponseNode | null | undefined): string | null {
  const entry = getResponseEntry(response)
  const example = entry?.examples?.find((item) => item.value !== undefined || item.serializedValue !== undefined)
  if (!entry || !example) return null
  if (example.value !== undefined) return toLiteral(example.value)
  // `responseReturn` sends raw text only for a text response. For a binary one the example would go out JSON-encoded.
  // A serialized SSE example is already events, which `responseReturn` sends as is when the body is `undefined`.
  if (!ast.mediaType.isJson(entry)) {
    const isTextBody = ast.mediaType.getBase(entry) !== 'text/event-stream' && getTextContentType(response) === entry.contentType
    return isTextBody ? toLiteral(example.serializedValue) : null
  }
  // `responseReturn` encodes a JSON body itself, so a serialized JSON example is parsed first.
  try {
    return toLiteral(JSON.parse(example.serializedValue!))
  } catch {
    return null
  }
}

const mswMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])

/**
 * Converts an HTTP method to its lowercase MSW equivalent (e.g., 'POST' → 'post'). MSW has no `http.query`, `http.trace` or
 * handler for a custom `additionalOperations` method, so such an operation maps to `http.all` and its handler checks the
 * method itself.
 */
export function getMswMethod(node: ast.HttpOperationNode): string {
  return mswMethods.has(node.method) ? node.method.toLowerCase() : 'all'
}

/**
 * The `headers` entry of a mocked `Response` init, or an empty string when there is no header to send.
 */
function headersBlock(contentType: string | null, headers: Array<[string, string]>): string {
  const entries = [
    ...(contentType ? [`'Content-Type': ${text.quote(contentType)}`] : []),
    ...headers.map(([name, value]) => `${text.quote(name)}: ${text.quote(value)}`),
  ]
  return entries.length ? `\n      headers: {\n        ${entries.join(',\n        ')}\n      },` : ''
}

/**
 * The `new HttpResponse<string>(...)` expression a mocked handler returns.
 */
export function responseLiteral(body: string, status: number, contentType: string | null, headers: Array<[string, string]>): string {
  return `new HttpResponse<string>(${body}, {
      status: ${status},${headersBlock(contentType, headers)}
    })`
}
