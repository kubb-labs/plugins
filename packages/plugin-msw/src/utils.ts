import type { ast } from 'kubb/kit'

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
  const jsonEntry = contents.find((entry) => {
    const baseType = entry.contentType?.split(';')[0]?.trim().toLowerCase()
    return baseType === 'application/json' || baseType?.endsWith('+json')
  })
  const value = (jsonEntry ?? contents[0])?.contentType
  return typeof value === 'string' && value.length > 0 ? value : null
}

/**
 * Converts an HTTP method to its lowercase MSW equivalent (e.g., 'POST' → 'post'). MSW has no
 * `http.query`, so a QUERY operation maps to `http.all` and its handler checks the method itself.
 */
export function getMswMethod(node: ast.HttpOperationNode): string {
  return node.method === 'QUERY' ? 'all' : node.method.toLowerCase()
}

/**
 * The `headers` entry of a mocked `Response` init, or an empty string when there is no content type.
 */
function headersBlock(contentType: string | null): string {
  return contentType ? `\n      headers: {\n        'Content-Type': '${contentType}'\n      },` : ''
}

/**
 * The `new HttpResponse(...)` expression a mocked handler returns.
 */
export function responseLiteral(body: string, status: number, contentType: string | null): string {
  return `new HttpResponse(${body}, {
      status: ${status},${headersBlock(contentType)}
    })`
}
