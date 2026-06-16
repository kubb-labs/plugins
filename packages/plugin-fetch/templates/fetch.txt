/**
 * plugin-fetch transport prelude. A TypeScript fragment kept as text (`.txt`) so it is never
 * type-checked on its own: it is appended after the shared client runtime, so the runtime types
 * (`Transport`, `ResolvedRequest`, `TransportResult`, `ResponseType`) and `createClientCore` are
 * only in scope once composed.
 *
 * It wraps `globalThis.fetch` as the default transport and exports the default `client` plus a
 * `createClient` factory. To swap or extend the transport, pass a `transport` through the client
 * config (`client.setConfig({ transport })`); no custom plugin is needed.
 */

/**
 * Picks a `responseType` from a `Content-Type` header, or `undefined` when it is not recognized.
 */
function detectResponseType(contentType: string | null): ResponseType | undefined {
  if (!contentType) return undefined
  if (contentType.includes('application/json') || contentType.includes('text/json')) return 'json'
  if (contentType.includes('text/')) return 'text'
  if (contentType.includes('image/') || contentType.includes('application/octet-stream')) return 'blob'
  return undefined
}

/**
 * Parses a `fetch` response body. Empty responses (204/205/304 or no body) resolve to `undefined`.
 * An explicit `responseType`, or one detected from the `Content-Type` header, forces the matching
 * `Response` method; otherwise the body is read as text and `JSON.parse`d, falling back to raw text.
 */
async function parseResponse(response: Response, responseType?: ResponseType): Promise<unknown> {
  if (response.status === 204 || response.status === 205 || response.status === 304 || !response.body) {
    return undefined
  }

  switch (responseType ?? detectResponseType(response.headers.get('Content-Type'))) {
    case 'text':
    case 'document':
      return response.text()
    case 'blob':
      return response.blob()
    case 'arraybuffer':
      return response.arrayBuffer()
    case 'stream':
      return response.body ?? undefined
    case 'json': {
      // An empty body with a JSON content-type would make response.json() throw; treat it as no data.
      const body = await response.text()
      return body ? JSON.parse(body) : undefined
    }
  }

  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * The default transport: builds a native `Request` from the resolved request, sends it through
 * `globalThis.fetch`, and returns the parsed body alongside the native request/response objects.
 */
const defaultTransport: Transport = async (request: ResolvedRequest): Promise<TransportResult> => {
  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
  }
  if (request.credentials) init.credentials = request.credentials

  const nativeRequest = new Request(request.url, init)
  const response = await globalThis.fetch(nativeRequest)
  const data = await parseResponse(response, request.responseType)

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    request: nativeRequest,
    response,
  }
}

export const client = createClientCore({ defaultTransport })

export const createClient = (config?: Parameters<typeof client.createClient>[0]) => client.createClient(config)
