import {
  createClientCore,
  detectResponseType,
  getResponseContentType,
  parseJsonOrText,
  resolveResponseType,
  type ResolvedRequest,
  type ResponseType,
  type ResponseTypeMap,
  type Transport,
  type TransportResult,
} from './core.ts'
import { isJsonMediaType } from './serializers.ts'
import * as core from './core.ts'

export * from './core.ts'

/** The request and response objects of this transport, carried on every result and error. */
export type NativeRequest = Request
export type NativeResponse = Response

/**
 * The `options` of every request, client config, and resolved request: extra `fetch` init the transport spreads onto
 * the `Request`, for fields the runtime does not set itself such as `cache`, `redirect`, and Next.js's `next`.
 */
export type NativeOptions = RequestInit & { next?: Record<string, unknown> }

export type ResponseError<TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.ResponseError<TError, TRequest, TResponse>
/** The core's `ResponseError` class, typed with this transport's request and response. `instanceof` and `ResponseError.is` both match what the client throws. */
export const ResponseError = core.ResponseError as {
  new <TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse>(
    config: ConstructorParameters<typeof core.ResponseError<TError, TRequest, TResponse>>[0],
  ): core.ResponseError<TError, TRequest, TResponse>
  is: typeof core.ResponseError.is
  // `instanceof` narrows to this type, so it carries the native request and response.
  prototype: core.ResponseError<unknown, NativeRequest, NativeResponse>
}

async function parseResponse(response: Response, responseType?: ResponseType | ResponseTypeMap): Promise<unknown> {
  if (response.status === 204 || response.status === 205 || response.status === 304 || !response.body) {
    return undefined
  }

  const contentType = response.headers.get('Content-Type')
  const requested = resolveResponseType(responseType, contentType)
  // An error body, and a JSON answer to a streamed operation, are decoded by their content type. Any other body keeps the requested type.
  switch (!response.ok || (requested === 'stream' && isJsonMediaType(contentType)) ? detectResponseType(contentType) : requested) {
    case 'text':
    case 'document':
      return response.text()
    case 'blob':
      return response.blob()
    case 'arraybuffer':
      return response.arrayBuffer()
    case 'stream':
      return response.body ?? undefined
    case 'json':
      return parseJsonOrText(await response.text())
  }

  return parseJsonOrText(await response.text())
}

/**
 * The default transport that sends the resolved request through `globalThis.fetch` and returns the parsed body with the native request and response.
 */
export const defaultTransport: Transport = async (request: ResolvedRequest): Promise<TransportResult> => {
  const init: RequestInit = {
    ...request.options,
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
    contentType: getResponseContentType(response.headers),
    request: nativeRequest,
    response,
  }
}

export const client = createClientCore({ defaultTransport })

export const createClient = client.createClient
