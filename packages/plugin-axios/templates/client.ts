import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { createClientCore, getResponseContentType, isStreamed } from './core.ts'
import { isJsonMediaType } from './serializers.ts'
import type * as core from './core.ts'
import * as sse from './sse.ts'

export * from './core.ts'
export * from './sse.ts'

/** The request and response objects of this transport, carried on every result and error. */
export type NativeRequest = AxiosRequestConfig
export type NativeResponse = AxiosResponse

/**
 * Extra axios config the transport spreads onto every request, an escape hatch for per-call fields the runtime does not set itself such as `timeout`, `proxy`, and the progress callbacks.
 */
export type AxiosOptions = AxiosRequestConfig

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
  options?: AxiosOptions
}
export type Options<TData extends core.DataShape, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = core.Options<
  TData,
  ThrowOnError,
  TRequest,
  TResponse
> & { options?: AxiosOptions }
export type ClientConfig<TRequest = NativeRequest, TResponse = NativeResponse> = core.ClientConfig<TRequest, TResponse> & { options?: AxiosOptions }
export type ResolvedRequest = core.ResolvedRequest & { options?: AxiosOptions }
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

/**
 * Collects the headers axios read into a `Headers`, so the core and the interceptors see one shape for every transport.
 */
function toHeaders(raw: AxiosResponse['headers']): Headers {
  const headers = new Headers()
  for (const [name, value] of Object.entries(raw ?? {})) {
    if (value === undefined || value === null) continue
    for (const item of Array.isArray(value) ? value : [value]) headers.append(name, String(item))
  }
  return headers
}

async function readStreamedText(data: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array | string>): Promise<string> {
  if (data instanceof ReadableStream) return new Response(data).text()
  const decoder = new TextDecoder()
  let text = ''
  for await (const chunk of data) text += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true })
  return text + decoder.decode()
}

/**
 * Reads a streamed JSON body, such as an error body, back into its value, because every adapter streams a
 * `responseType: 'stream'` answer: the fetch adapter as a `ReadableStream`, the Node adapter as a readable. Any other
 * streamed body stays a stream.
 */
async function readStreamedBody({ data, contentType }: { data: unknown; contentType: string | undefined }): Promise<unknown> {
  if (!isStreamed(data) || !isJsonMediaType(contentType)) return data
  const text = await readStreamedText(data)
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Turns an axios instance into a transport: each resolved request becomes one `instance.request` with the instance's
 * defaults, adapter, and axios interceptors. Every status resolves, because the core splits success from error itself.
 */
export function createAxiosTransport(instance: AxiosInstance): Transport {
  return async (request) => {
    const config: AxiosRequestConfig = {
      ...request.options,
      url: request.url,
      method: request.method,
      headers: request.headers,
      data: request.body,
      // Kubb already serialized the body; only URLSearchParams needs a string, since axios's Node adapter rejects it.
      transformRequest: (data) => (data instanceof URLSearchParams ? data.toString() : data),
      signal: request.signal,
      responseType: request.responseType,
      validateStatus: () => true,
    }
    if (request.credentials) config.withCredentials = request.credentials === 'include'

    // Only the fetch adapter exposes a streaming `response.data` in the browser. The default XHR adapter buffers the whole body.
    if (request.responseType === 'stream' && !config.adapter) config.adapter = 'fetch'

    const response = await instance.request<unknown>(config)
    const headers = toHeaders(response.headers)
    const contentType = getResponseContentType(headers)

    return {
      data: await readStreamedBody({ data: response.data, contentType }),
      status: response.status,
      statusText: response.statusText,
      headers,
      contentType,
      request: response.config,
      response,
    }
  }
}

/**
 * The axios instance the generated `client` sends through. Set its defaults or register axios interceptors on it.
 */
export const axiosInstance = axios.create()

/**
 * The default transport: `axiosInstance` behind `createAxiosTransport`.
 */
export const defaultTransport: Transport = createAxiosTransport(axiosInstance)

export const client = createClientCore({ defaultTransport })

export const createClient = (config?: Parameters<typeof client.createClient>[0]) => client.createClient(config)
