import * as core from './core'
import axios from 'axios'
import type { Transport } from './core'
import type { AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios'
import { createClientCore, getResponseContentType, isStreamed } from './core'
import { isJsonMediaType } from './serializers'
export * from './core'

/** The request and response objects of this transport, carried on every result and error. */
export type NativeRequest = AxiosRequestConfig
export type NativeResponse = AxiosResponse

/**
 * Extra axios config the transport spreads onto every request, an escape hatch for per-call fields the runtime does not set itself such as `timeout`, `proxy`, and the progress callbacks.
 */
export type AxiosOptions = AxiosRequestConfig

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
export type ResponseError<TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = core.ResponseError<TError, TRequest, TResponse>
/** The core's `ResponseError` class, typed with this transport's request and response. `instanceof` and `ResponseError.is` both match what the client throws. */
export const ResponseError = core.ResponseError as {
  new <TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse>(
    config: ConstructorParameters<typeof core.ResponseError<TError, TRequest, TResponse>>[0],
  ): core.ResponseError<TError, TRequest, TResponse>
  is: typeof core.ResponseError.is
  prototype: core.ResponseError<unknown, NativeRequest, NativeResponse>
}

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
 * Reads a streamed JSON body, or any streamed error body, back into its value, because every adapter streams a
 * `responseType: 'stream'` answer: the fetch adapter as a `ReadableStream`, the Node adapter as a readable. Any other
 * streamed success body stays a stream.
 */
async function readStreamedBody({ data, contentType, status }: { data: unknown; contentType: string | undefined; status: number }): Promise<unknown> {
  if (!isStreamed(data) || !(status >= 300 || isJsonMediaType(contentType))) return data
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

    // Only the fetch adapter exposes a streaming `response.data` in the browser. The default XHR adapter buffers the whole body.
    if (request.responseType === 'stream' && !config.adapter) config.adapter = 'fetch'

    const response = await instance.request<unknown>(config)
    const headers = toHeaders(response.headers)
    const contentType = getResponseContentType(headers)

    return {
      data: await readStreamedBody({ data: response.data, contentType, status: response.status }),
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

export const createClient = (config?: Parameters<typeof client.createClient>[0]) => client.createClient(config)
