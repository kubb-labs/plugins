import * as core from './core'
import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios'
import { createClientCore, createLazyClient, getHeader } from './core'
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
export type TransportResult<TRequest = NativeRequest, TResponse = NativeResponse> = core.TransportResult<TRequest, TResponse>
export type DecodedResponse<TData = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.DecodedResponse<TData, TRequest, TResponse>
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

/**
 * A body the axios Node adapter sends as fetch would: it rejects a typed array, and labels a Blob with the Blob's own type
 * over the `Content-Type` header, so the Blob takes the header's type.
 */
function toAxiosData(body: unknown, contentType: string | undefined): unknown {
  if (ArrayBuffer.isView(body)) return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)
  if (body instanceof Blob && contentType && body.type !== contentType) return new Blob([body], { type: contentType })
  return body
}

/** Resolves an adapter setting to the function axios runs, or `undefined` when axios cannot resolve it here. */
function resolveAdapter(adapter: AxiosRequestConfig['adapter']): unknown {
  try {
    return axios.getAdapter(adapter)
  } catch {
    return undefined
  }
}

/** axios's fetch adapter, resolved once, to tell whether a request goes through fetch. */
let axiosFetchAdapter: unknown

/**
 * axios's own default adapter list, read on the first request. A mock such as `axios-mock-adapter` replaces it with a
 * function, so the axios 1.x list is the fallback when the mock came first.
 */
let axiosDefaultAdapters: string | undefined

/**
 * Turns an axios instance into a transport: each resolved request becomes one `instance.request` with the instance's
 * defaults, adapter, and axios interceptors. Every status resolves, because the core splits success from error itself.
 * The body is read as bytes, or as a stream when the call streams, and handed to the core as a web `Response`, so the
 * media types decode it as they do for fetch.
 */
export function createAxiosTransport(instance: AxiosInstance): (request: core.ResolvedRequest) => Promise<TransportResult> {
  return async (request) => {
    axiosFetchAdapter ??= resolveAdapter('fetch')
    axiosDefaultAdapters ??= Array.isArray(axios.defaults.adapter) ? String(axios.defaults.adapter) : 'xhr,http,fetch'
    const contentType = getHeader(request.headers, 'content-type')
    const config: AxiosRequestConfig = {
      ...request.options,
      url: request.url,
      method: request.method,
      // axios labels a post, put, or patch without a body as a form, so `false` leaves the header off, as fetch does.
      headers: request.body === undefined && contentType === undefined ? { ...request.headers, 'Content-Type': false } : request.headers,
      data: toAxiosData(request.body, contentType),
      // Kubb already serialized the body; only URLSearchParams needs a string, since axios's Node adapter rejects it.
      transformRequest: (data) => (data instanceof URLSearchParams ? data.toString() : data),
      // The core decodes the body by its media type, so axios hands over the bytes or the stream untouched.
      responseType: request.stream ? 'stream' : 'arraybuffer',
      transformResponse: (data) => data,
      signal: request.signal,
      validateStatus: () => true,
    }

    // In the browser the default adapters pick XHR, which buffers the whole body and cannot omit same-origin cookies, so a stream
    // or `credentials: 'omit'` switches to fetch. An adapter set on the call or the instance, and the Node http adapter with its
    // proxy and agent, are kept.
    const instanceAdapter = instance.defaults?.adapter
    const defaultAdapter = !instanceAdapter || String(instanceAdapter) === axiosDefaultAdapters
    const needsFetch = request.stream || request.credentials === 'omit'
    if (needsFetch && !config.adapter && defaultAdapter && typeof XMLHttpRequest !== 'undefined') config.adapter = 'fetch'

    // `credentials` wins over `withCredentials` in the options or the instance defaults. The fetch adapter takes the value as is,
    // while the other adapters only know a boolean, where `false` keeps cookies same-origin.
    const adapter = resolveAdapter(config.adapter ?? instanceAdapter)
    const fetchAdapter = adapter !== undefined && adapter === axiosFetchAdapter
    if (request.credentials) {
      config.withCredentials = fetchAdapter ? (request.credentials as unknown as boolean) : request.credentials === 'include'
    }

    // axios rejects an abort with its own `CanceledError`, while fetch rejects with the signal's reason. The core rethrows
    // the reason for an abort while a stream is read.
    const response = await instance.request<unknown>(config).catch((error: unknown) => {
      throw request.signal?.aborted && axios.isCancel(error) ? request.signal.reason : error
    })
    const { data, status, statusText } = response
    // A null-body status cannot carry a body, and an adapter may read a missing body as ''.
    const body = [204, 205, 304].includes(status) || data === '' || data == null ? null : (data as BodyInit)
    return { webResponse: new Response(body, { status, statusText, headers: toHeaders(response.headers) }), request: response.config, response }
  }
}

let instance: AxiosInstance | undefined

/**
 * The axios instance `defaultTransport` sends through, created on first use. Set its defaults, or register native axios
 * interceptors on it.
 */
export function getAxiosInstance(): AxiosInstance {
  return (instance ??= axios.create())
}

/**
 * The default transport: `getAxiosInstance()` wrapped by `createAxiosTransport`. Wrap another instance the same way to send through it.
 */
export const defaultTransport: Transport = (request) => createAxiosTransport(getAxiosInstance())(request)

/** The client every generated operation uses unless the call passes its own. It is created on first use. */
export const client = createLazyClient((config) => createClientCore({ defaultTransport, ...config }))

export const createClient = client.createClient

import { formMediaTypes } from './mediaTypes.ts'
client.setConfig({ baseURL: 'https://petstore.swagger.io/v2', mediaTypes: { ...formMediaTypes } })
