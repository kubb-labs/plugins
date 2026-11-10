import { toResponseContent } from '@internals/shared'
import { stringify } from '@internals/utils'
import { ast } from '@kubb/kit'

export function getMockStatus(statusCode: ast.StatusCode): number {
  return /^[1-5]XX$/i.test(statusCode) ? Number(statusCode[0]) * 100 : Number(statusCode)
}

/**
 * The declared response headers a mock sends as strings, from an example (its `serializedValue` first) or a default.
 */
export function getMockHeaders(response: ast.ResponseNode | null | undefined): Array<[name: string, value: string]> {
  return (response?.headers ?? []).flatMap((header): Array<[string, string]> => {
    const example = header.examples?.find((entry) => entry.serializedValue !== undefined || entry.value !== undefined)
    const value = example?.serializedValue ?? example?.value ?? header.schema.default ?? header.schema.examples?.[0]
    if (value === undefined || value === null) return []
    // Headers use the `simple` style, so an array is sent comma-separated.
    return [[header.name, Array.isArray(value) ? value.join(',') : typeof value === 'string' ? value : JSON.stringify(value)]]
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
  const contents = response?.content ?? []
  const value = (contents.find((entry) => isJson(entry.contentType)) ?? contents[0])?.contentType
  return typeof value === 'string' && value.length > 0 ? value : null
}

function isJson(contentType: string | undefined): boolean {
  const baseType = contentType?.split(';')[0]?.trim().toLowerCase()
  return baseType === 'application/json' || Boolean(baseType?.endsWith('+json'))
}

/**
 * The first content type of a response that the client reads as text, such as `application/xml`, or `null` when none is.
 */
function getTextContentType(response: ast.ResponseNode | null | undefined): string | null {
  const entry = (response?.content ?? []).find((entry) => {
    const schema = toResponseContent(entry, response?.content).schema
    return !isJson(entry.contentType) && schema && ast.resolveRef(schema).primitive === 'string'
  })
  return entry?.contentType ?? null
}

/**
 * The statements that return a mocked `Response` for `body`. A string body for a response the client reads as text goes
 * out as raw text with that content type, so an XML mock is not sent as a quoted JSON string. Any other body is JSON.
 */
export function responseReturn(body: string, status: number, response: ast.ResponseNode | null | undefined): string {
  const contentType = getContentType(response)
  const headers = getMockHeaders(response)
  const textContentType = hasResponseSchema(response) ? getTextContentType(response) : null
  if (!textContentType) return `return ${responseLiteral(`JSON.stringify(${body})`, status, contentType, headers)}`

  // A plain variable such as `data` is checked as it is, an expression such as `data ?? createPet(data)` is read once.
  const name = /^\w+$/.test(body) ? body : 'body'
  return `${name === body ? '' : `const body = ${body}\n    `}if (typeof ${name} === 'string') return ${responseLiteral(name, status, textContentType, headers)}

    return ${responseLiteral(`JSON.stringify(${name})`, status, contentType, headers)}`
}

export function getExampleBody(response: ast.ResponseNode | null | undefined): string | null {
  for (const entry of response?.content ?? []) {
    const example = entry.examples?.find((item) => item.value !== undefined || item.serializedValue !== undefined)
    if (example) return example.value !== undefined ? JSON.stringify(example.value) : stringify(example.serializedValue!)
  }
  return null
}

/**
 * Converts an HTTP method to its lowercase MSW equivalent (e.g., 'POST' → 'post'). MSW has no
 * `http.query`, so a QUERY operation maps to `http.all` and its handler checks the method itself.
 */
export function getMswMethod(node: ast.HttpOperationNode): string {
  return node.method === 'QUERY' ? 'all' : node.method.toLowerCase()
}

/**
 * The `headers` entry of a mocked `Response` init, or an empty string when there is no header to send.
 */
function headersBlock(contentType: string | null, headers: Array<[string, string]>): string {
  const entries = [...(contentType ? [`'Content-Type': '${contentType}'`] : []), ...headers.map(([name, value]) => `${stringify(name)}: ${stringify(value)}`)]
  return entries.length ? `\n      headers: {\n        ${entries.join(',\n        ')}\n      },` : ''
}

/**
 * The `new HttpResponse<string>(...)` expression a mocked handler returns.
 */
export function responseLiteral(body: string, status: number, contentType: string | null, headers: Array<[string, string]> = []): string {
  return `new HttpResponse<string>(${body}, {
      status: ${status},${headersBlock(contentType, headers)}
    })`
}
