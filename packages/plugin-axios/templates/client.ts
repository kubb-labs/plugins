import axios from 'axios'
import type { AxiosHeaders, AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios'
import { createClientCore, getResponseContentType, isStreamed, parseJsonOrText, resolveResponseType, type ResponseType } from './core.ts'
import { isJsonMediaType } from './serializers.ts'
import * as core from './core.ts'

export * from './core.ts'

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

async function readStreamedBytes(data: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array | string>): Promise<ArrayBuffer> {
  if (data instanceof ReadableStream) return new Response(data).arrayBuffer()
  const chunks: Array<BlobPart> = []
  for await (const chunk of data) chunks.push(chunk as BlobPart)
  return new Blob(chunks).arrayBuffer()
}

/**
 * Decodes bytes with the given parser, as the fetch transport reads them. Anything that is not bytes is returned as is.
 */
function decodeBytes(data: unknown, responseType: ResponseType | undefined, contentType: string | null): unknown {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data instanceof Uint8Array ? data : undefined
  if (!bytes) return data
  if (responseType === 'blob') return new Blob([bytes as Uint8Array<ArrayBuffer>], { type: contentType ?? '' })
  if (responseType === 'arraybuffer') {
    const whole = bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength
    return whole ? bytes.buffer : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)
  }
  if (responseType === 'stream') return new Blob([bytes as Uint8Array<ArrayBuffer>]).stream()
  const text = new TextDecoder().decode(bytes)
  return responseType === 'text' || responseType === 'document' ? text : parseJsonOrText(text)
}

/**
 * Reads an error body or a streamed JSON body back into its value, as the fetch transport does. A text error stays text.
 * A `'blob'` or `'arraybuffer'` error is decoded when its content type is JSON or text, and kept as read otherwise.
 * Any other success body is returned as read.
 */
async function readBody({ data, contentType, status }: { data: unknown; contentType: string | undefined; status: number }): Promise<unknown> {
  if (status >= 300 && (data instanceof Blob || data instanceof ArrayBuffer || data instanceof Uint8Array)) {
    const type = resolveResponseType(undefined, contentType)
    if (type !== 'json' && type !== 'text') return data
    const text = data instanceof Blob ? await data.text() : new TextDecoder().decode(data)
    return type === 'json' ? parseJsonOrText(text) : text
  }
  if (!isStreamed(data) || !(status >= 300 || isJsonMediaType(contentType))) return data
  return parseJsonOrText(new TextDecoder().decode(await readStreamedBytes(data)))
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
const axiosFetchAdapter = resolveAdapter('fetch')

/**
 * Turns an axios instance into a transport: each resolved request becomes one `instance.request` with the instance's
 * defaults, adapter, and axios interceptors. Every status resolves, because the core splits success from error itself.
 */
export function createAxiosTransport(instance: AxiosInstance): (request: core.ResolvedRequest) => Promise<TransportResult> {
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
    // stream when an entry asks for one. Bytes are decoded in `transformResponse`, before the axios interceptors run, so they
    // see the parsed body. A stream passes through and is read below when its entry is not a stream.
    const map = typeof request.responseType === 'object' ? request.responseType : undefined
    const streamed = request.responseType === 'stream' || Boolean(map && Object.values(map).includes('stream'))
    if (map) {
      config.responseType = streamed ? 'stream' : 'arraybuffer'
      // An error body is left as read, and `readBody` decodes it by its content type.
      config.transformResponse = (data, responseHeaders, status) => {
        if (status !== undefined && status >= 300) return data
        const header = (responseHeaders as AxiosHeaders).get('Content-Type')?.toString() ?? null
        return decodeBytes(data, resolveResponseType(map, header), header)
      }
    }

    // In the browser the default adapters pick XHR, which buffers the whole body and cannot omit same-origin cookies, so a stream
    // or `credentials: 'omit'` switches to fetch. An adapter set on the call or the instance, and the Node http adapter with its
    // proxy and agent, are kept. axios's own default is the list `['xhr', 'http', 'fetch']`.
    const instanceAdapter = instance.defaults?.adapter
    const defaultAdapter = !instanceAdapter || String(instanceAdapter) === 'xhr,http,fetch'
    const needsFetch = streamed || request.credentials === 'omit'
    if (needsFetch && !config.adapter && defaultAdapter && typeof XMLHttpRequest !== 'undefined') config.adapter = 'fetch'

    // `credentials` wins over `withCredentials` in the options or the instance defaults. The fetch adapter takes the value as is,
    // while the other adapters only know a boolean, where `false` keeps cookies same-origin.
    const adapter = resolveAdapter(config.adapter ?? instanceAdapter)
    const fetchAdapter = adapter !== undefined && adapter === axiosFetchAdapter
    if (request.credentials) {
      config.withCredentials = fetchAdapter ? (request.credentials as unknown as boolean) : request.credentials === 'include'
    }

    // The Node http adapter has no 'blob' and would decode the bytes as text, so it reads a buffer that is wrapped as the fetch transport returns it.
    const blobFromBuffer = request.responseType === 'blob' && typeof XMLHttpRequest === 'undefined' && !fetchAdapter
    if (blobFromBuffer) config.responseType = 'arraybuffer'

    const response = await instance.request<unknown>(config)
    const headers = toHeaders(response.headers)
    const contentType = getResponseContentType(headers)
    const header = headers.get('Content-Type')
    const ok = response.status < 300
    let raw = blobFromBuffer && ok ? decodeBytes(response.data, 'blob', header) : response.data
    if (map && ok && isStreamed(raw)) {
      const resolved = resolveResponseType(map, contentType)
      if (resolved !== 'stream') raw = decodeBytes(await readStreamedBytes(raw), resolved, header)
    }
    // axios reads an empty body as '', while the fetch transport reads it as no data unless the body is text.
    const textBody = request.responseType === 'text' || resolveResponseType(undefined, contentType) === 'text'
    if (raw === '' && !textBody) raw = undefined

    return {
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
export const defaultTransport = createAxiosTransport(axiosInstance)

export const client = createClientCore({ defaultTransport })

export const createClient = client.createClient
