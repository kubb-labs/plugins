import * as core from './core'
import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios'
import { createClientCore, createLazyClient, getHeader } from './core'
export * from './core'

/**
 * The native request and response that every result and error carries.
 */
export type NativeRequest = AxiosRequestConfig
export type NativeResponse = AxiosResponse

/**
 * Extra axios config for a call or client, such as `timeout`, `proxy`, or the progress callbacks.
 */
export type NativeOptions = AxiosRequestConfig

export type ResponseError<TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.ResponseError<TError, TRequest, TResponse>
export const ResponseError = core.ResponseError as {
  new <TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse>(
    config: ConstructorParameters<typeof core.ResponseError<TError, TRequest, TResponse>>[0],
  ): core.ResponseError<TError, TRequest, TResponse>
  is: typeof core.ResponseError.is
  prototype: core.ResponseError<unknown, NativeRequest, NativeResponse>
}

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

function toHeaders(raw: AxiosResponse['headers']): Headers {
  const headers = new Headers()
  for (const [name, value] of Object.entries(raw ?? {})) {
    if (value === undefined || value === null) continue
    for (const item of Array.isArray(value) ? value : [value]) headers.append(name, String(item))
  }
  return headers
}

// The Node adapter rejects a typed array, and labels a Blob with its own type over the `Content-Type` header.
function toAxiosData(body: unknown, contentType: string | undefined): unknown {
  if (ArrayBuffer.isView(body)) return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)
  if (body instanceof Blob && contentType && body.type !== contentType) return new Blob([body], { type: contentType })
  return body
}

function resolveAdapter(adapter: AxiosRequestConfig['adapter']): unknown {
  try {
    return axios.getAdapter(adapter)
  } catch {
    return undefined
  }
}

let axiosFetchAdapter: unknown

// A mock such as `axios-mock-adapter` replaces the default adapter list, so the axios 1.x list is the fallback.
let axiosDefaultAdapters: string | undefined

/**
 * Turns an axios instance into a transport that keeps its defaults, adapter, and interceptors.
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
      // The body is already encoded. Only `URLSearchParams` needs a string, since the Node adapter rejects it.
      transformRequest: (data) => (data instanceof URLSearchParams ? data.toString() : data),
      responseType: request.stream ? 'stream' : 'arraybuffer',
      transformResponse: (data) => data,
      signal: request.signal,
      validateStatus: () => true,
    }

    // XHR buffers the body and cannot omit same-origin cookies, so a stream or `credentials: 'omit'` uses fetch in the browser.
    const instanceAdapter = instance.defaults?.adapter
    const defaultAdapter = !instanceAdapter || String(instanceAdapter) === axiosDefaultAdapters
    const needsFetch = request.stream || request.credentials === 'omit'
    if (needsFetch && !config.adapter && defaultAdapter && typeof XMLHttpRequest !== 'undefined') config.adapter = 'fetch'

    // The fetch adapter takes `credentials` as is. The other adapters only know a boolean.
    const adapter = resolveAdapter(config.adapter ?? instanceAdapter)
    const fetchAdapter = adapter !== undefined && adapter === axiosFetchAdapter
    if (request.credentials) {
      config.withCredentials = fetchAdapter ? (request.credentials as unknown as boolean) : request.credentials === 'include'
    }

    // Rethrow the signal's reason, as fetch does, instead of axios's `CanceledError`.
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
 * The axios instance `defaultTransport` sends through, created on first use.
 */
export function getAxiosInstance(): AxiosInstance {
  return (instance ??= axios.create())
}

export const defaultTransport: Transport = (request) => createAxiosTransport(getAxiosInstance())(request)

/**
 * The client every generated operation uses unless a call passes its own. It is created on first use.
 */
export const client = createLazyClient((config) => createClientCore({ defaultTransport, ...config }))

export const createClient = client.createClient

import { formMediaTypes } from './mediaTypes.ts'
client.setConfig({ baseURL: 'https://petstore.swagger.io/v2', mediaTypes: { ...formMediaTypes } })
