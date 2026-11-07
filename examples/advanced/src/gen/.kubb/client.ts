import * as core from './core'
import axios from 'axios'
import type { ResponseType } from './core'
import type { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios'
import { createClientCore, getResponseContentType, isStreamed, parseJsonOrText, resolveResponseType } from './core'
import { isJsonMediaType } from './serializers'
export * from './core'

/** The request and response objects of this transport, carried on every result and error. */
export type NativeRequest = AxiosRequestConfig
export type NativeResponse = AxiosResponse

/**
 * The `options` of every request, client config, and resolved request: extra axios config the transport spreads onto
 * the request, for per-call fields the runtime does not set itself such as `timeout`, `proxy`, and the progress callbacks.
 */
export type NativeOptions = AxiosRequestConfig

export type ResponseError<TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.ResponseError<TError, TRequest, TResponse>
/** The core's `ResponseError` class, typed with this transport's request and response. `instanceof` and `ResponseError.is` both match what the client throws. */
export const ResponseError = core.ResponseError as {
  new <TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse>(
    config: ConstructorParameters<typeof core.ResponseError<TError, TRequest, TResponse>>[0],
  ): core.ResponseError<TError, TRequest, TResponse>
  is: typeof core.ResponseError.is
  prototype: core.ResponseError<unknown, NativeRequest, NativeResponse>
}

/** The core's request, result, and client types, bound to this transport's request, response, and options. */
export type RequestConfig<TBody = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.RequestConfig<TBody, TRequest, TResponse> & {
  options?: NativeOptions
}
export type Options<TData extends core.DataShape, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = core.Options<
  TData,
  ThrowOnError,
  TRequest,
  TResponse
> & { options?: NativeOptions }
export type ClientConfig<TRequest = NativeRequest, TResponse = NativeResponse> = core.ClientConfig<TRequest, TResponse> & { options?: NativeOptions }
export type ResolvedRequest = core.ResolvedRequest & { options?: NativeOptions }
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
export type ResponseErrorConfig<TError = unknown> = core.ResponseError<TError, NativeRequest, NativeResponse>
export type TransportResult<TData = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.TransportResult<TData, TRequest, TResponse>
export type Transport<TRequest = NativeRequest, TResponse = NativeResponse> = core.Transport<TRequest, TResponse>
export type Interceptors<TRequest = NativeRequest, TResponse = NativeResponse> = core.Interceptors<TRequest, TResponse>
export type ClientInstance<TRequest = NativeRequest, TResponse = NativeResponse> = core.ClientInstance<TRequest, TResponse>

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

/** The bytes of a body axios read as a buffer or left as a stream, or `undefined` for any other body. */
async function toArrayBuffer(data: unknown): Promise<ArrayBuffer | undefined> {
  if (data instanceof ReadableStream) return new Response(data).arrayBuffer()
  if (data instanceof ArrayBuffer) return data
  if (data instanceof Uint8Array) return new Uint8Array(data).buffer
  if (!isStreamed(data)) return undefined
  const chunks: Array<Uint8Array> = []
  for await (const chunk of data) chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk)
  const bytes = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.byteLength, 0))
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return bytes.buffer
}

async function readStreamedText(data: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array | string>): Promise<string> {
  return new TextDecoder().decode(await toArrayBuffer(data))
}

/**
 * Decodes a body axios read as bytes with the parser the response `Content-Type` picked from a map, as the fetch transport
 * reads it. A stream stays as read.
 */
async function decodeMappedBody(data: unknown, responseType: ResponseType | undefined, contentType: string | null): Promise<unknown> {
  if (responseType === 'stream' || responseType === 'formdata') return data
  const buffer = await toArrayBuffer(data)
  if (!buffer) return data
  if (responseType === 'blob') return new Blob([buffer], { type: contentType ?? '' })
  if (responseType === 'arraybuffer') return buffer
  const text = new TextDecoder().decode(buffer)
  return responseType === 'text' || responseType === 'document' ? text : parseJsonOrText(text)
}

/**
 * Reads a streamed JSON body, or any error body the adapter read as text, bytes, or a stream, back into its value, as
 * the fetch transport decodes an error by its content type. Every adapter streams a `responseType: 'stream'` answer, and
 * a `'text'`, `'blob'`, or `'arraybuffer'` error body arrives as read. Any other success body is returned as read.
 */
async function readBody({ data, contentType, status }: { data: unknown; contentType: string | undefined; status: number }): Promise<unknown> {
  if (status >= 300) {
    if (typeof data === 'string' && data) return parseJsonOrText(data)
    if (data instanceof Blob) return parseJsonOrText(await data.text())
    if (data instanceof ArrayBuffer || data instanceof Uint8Array) return parseJsonOrText(new TextDecoder().decode(data))
  }
  if (!isStreamed(data) || !(status >= 300 || isJsonMediaType(contentType))) return data
  return parseJsonOrText(await readStreamedText(data))
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
      responseType: typeof request.responseType === 'string' ? request.responseType : undefined,
      validateStatus: () => true,
    }

    // A map is chosen from the response `Content-Type`, which arrives with the body, so the body is read as bytes, or as a
    // stream when an entry asks for one, and decoded afterwards.
    const map = typeof request.responseType === 'object' ? request.responseType : undefined
    const streamed = request.responseType === 'stream' || Boolean(map && Object.values(map).includes('stream'))
    if (map) config.responseType = streamed ? 'stream' : 'arraybuffer'

    // In the browser the default adapters pick XHR, which buffers the whole body and cannot omit same-origin cookies, so a stream
    // or `credentials: 'omit'` switches to fetch. An adapter set on the call or the instance, and the Node http adapter with its
    // proxy and agent, are kept.
    const defaultAdapter = !instance.defaults?.adapter || String(instance.defaults.adapter) === String(axios.defaults.adapter)
    const needsFetch = streamed || request.credentials === 'omit'
    if (needsFetch && !config.adapter && defaultAdapter && typeof XMLHttpRequest !== 'undefined') config.adapter = 'fetch'

    // `credentials` wins over `withCredentials` in the options or the instance defaults. The fetch adapter takes the value as is,
    // while the other adapters only know a boolean, where `false` keeps cookies same-origin.
    const fetchAdapter = (config.adapter ?? instance.defaults?.adapter) === 'fetch'
    if (request.credentials) {
      config.withCredentials = fetchAdapter ? (request.credentials as unknown as boolean) : request.credentials === 'include'
    }

    // The Node http adapter has no 'blob' and would decode the bytes as text, so it reads a buffer that is wrapped as the fetch transport returns it.
    const blobFromBuffer = request.responseType === 'blob' && typeof XMLHttpRequest === 'undefined' && !fetchAdapter
    if (blobFromBuffer) config.responseType = 'arraybuffer'

    const response = await instance.request<unknown>(config)
    const headers = toHeaders(response.headers)
    const contentType = getResponseContentType(headers)
    const raw =
      blobFromBuffer && (response.data instanceof Uint8Array || response.data instanceof ArrayBuffer)
        ? new Blob([new Uint8Array(response.data)], { type: headers.get('Content-Type') ?? '' })
        : map && response.status < 300
          ? await decodeMappedBody(response.data, resolveResponseType(map, contentType), headers.get('Content-Type'))
          : response.data

    return {
      // axios reads a bodiless status as '', while the fetch transport reads it as no data. Any other empty body stays '' on both.
      data: [204, 205, 304].includes(response.status) ? undefined : await readBody({ data: raw, contentType, status: response.status }),
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
 * The axios instance `defaultTransport` sends through. Set its defaults, or register native axios interceptors on it.
 */
export const axiosInstance = axios.create()

/**
 * The default transport: `axiosInstance` wrapped by `createAxiosTransport`. Wrap another instance the same way to send through it.
 */
export const defaultTransport: Transport = createAxiosTransport(axiosInstance)

export const client = createClientCore({ defaultTransport })

export const createClient = client.createClient

client.setConfig({ baseURL: 'https://petstore3.swagger.io/api/v3' })
export * from './sse.ts'
