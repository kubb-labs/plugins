import { createClientCore, getResponseContentType, type ResponseType } from './core.ts'
import { isJsonMediaType } from './serializers.ts'
import type * as core from './core.ts'
import * as sse from './sse.ts'

export * from './core.ts'
export * from './sse.ts'

/** The request and response objects of this transport, carried on every result and error. */
export type NativeRequest = Request
export type NativeResponse = Response

/**
 * Extra `fetch` init the transport spreads onto every `Request`, an escape hatch for fields the runtime does not set itself such as `cache`, `redirect`, and Next.js's `next`.
 */
export type FetchOptions = RequestInit & { next?: Record<string, unknown> }

export type RequestResult<TResponses, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = core.RequestResult<
  TResponses,
  ThrowOnError,
  TRequest,
  TResponse
>
export type UnwrappedResult<TResponses, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = core.UnwrappedResult<
  TResponses,
  ThrowOnError,
  TRequest,
  TResponse
>
export type RequestConfig<TBody = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.RequestConfig<TBody, TRequest, TResponse> & {
  options?: FetchOptions
}
export type Options<TData extends core.DataShape, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = core.Options<
  TData,
  ThrowOnError,
  TRequest,
  TResponse
> & { options?: FetchOptions }
export type ClientConfig<TRequest = NativeRequest, TResponse = NativeResponse> = core.ClientConfig<TRequest, TResponse> & { options?: FetchOptions }
export type ResolvedRequest = core.ResolvedRequest & { options?: FetchOptions }
export type TransportResult<TData = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.TransportResult<TData, TRequest, TResponse>
export type Transport<TRequest = NativeRequest, TResponse = NativeResponse> = core.Transport<TRequest, TResponse>
export type CallResult<TRequest = NativeRequest, TResponse = NativeResponse> = core.CallResult<TRequest, TResponse>
export type Interceptors<TRequest = NativeRequest, TResponse = NativeResponse> = core.Interceptors<TRequest, TResponse>
export type ClientInstance<TRequest = NativeRequest, TResponse = NativeResponse> = core.ClientInstance<TRequest, TResponse>
export type ResponseErrorConfig<TError = unknown> = core.ResponseError<TError, NativeRequest, NativeResponse>
export type EventStreamResult<TData = unknown, TResponse = NativeResponse> = sse.EventStreamResult<TData, TResponse>

/** `toEventStream` with the result bound to this transport's response. */
export const toEventStream: <TData = unknown>(
  call: Promise<sse.EventStreamCall<NativeResponse>>,
  options?: Parameters<typeof sse.toEventStream>[1],
) => Promise<EventStreamResult<TData>> = sse.toEventStream

function detectResponseType(contentType: string | null): ResponseType | undefined {
  if (!contentType) return undefined
  if (contentType.includes('text/event-stream')) return 'stream'
  if (contentType.includes('application/json') || contentType.includes('text/json')) return 'json'
  if (contentType.includes('text/')) return 'text'
  if (contentType.includes('image/') || contentType.includes('application/octet-stream')) return 'blob'
  return undefined
}

async function parseResponse(response: Response, responseType?: ResponseType): Promise<unknown> {
  if (response.status === 204 || response.status === 205 || response.status === 304 || !response.body) {
    return undefined
  }

  const contentType = response.headers.get('Content-Type')
  // A server may answer a streamed operation with JSON, such as an error body. Any other streamed body stays a stream.
  const detected = responseType === 'stream' && isJsonMediaType(contentType) ? 'json' : responseType
  switch (detected ?? detectResponseType(contentType)) {
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
      // An empty body with a JSON content-type would make response.json() throw, so treat it as no data.
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

export const createClient = (config?: Parameters<typeof client.createClient>[0]) => client.createClient(config)
