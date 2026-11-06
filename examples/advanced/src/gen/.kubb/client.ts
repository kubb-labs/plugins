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

    // In the browser the default adapters pick XHR, which buffers the whole body and cannot omit same-origin cookies, so a stream
    // or `credentials: 'omit'` switches to fetch. An adapter set on the call or the instance, and the Node http adapter with its
    // proxy and agent, are kept.
    const defaultAdapter = !instance.defaults?.adapter || String(instance.defaults.adapter) === String(axios.defaults.adapter)
    const needsFetch = request.responseType === 'stream' || request.credentials === 'omit'
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
        : response.data

    return {
      // axios reads a bodiless status as '', while the fetch transport reads it as no data. Any other empty body stays '' on both.
      data: [204, 205, 304].includes(response.status) ? undefined : await readStreamedBody({ data: raw, contentType, status: response.status }),
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

client.setConfig({ baseURL: 'https://petstore3.swagger.io/api/v3' })
export * from './sse.ts'
