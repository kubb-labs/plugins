import * as core from './core'
import axios from 'axios'
import type { CallResult, Transport } from './core'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getResponseContentType, isStreamed } from './core'
import { isJsonMediaType } from './serializers'
export * from './core'

/** The request and response objects of this transport, carried on every result and error. */
export type NativeRequest = AxiosRequestConfig
export type NativeResponse = AxiosResponse

/**
 * Extra axios config the transport spreads onto every request, an escape hatch for per-call fields the runtime does not set itself such as `timeout`, `proxy`, and the progress callbacks.
 */
export type AxiosOptions = AxiosRequestConfig

/** A transport as this client accepts it: an axios instance, which `createAxiosTransport` wraps, or a transport function. */
export type AxiosTransport = AxiosInstance | Transport

type AxiosOverrides = {
  options?: AxiosOptions
  transport?: AxiosTransport
  /**
   * @deprecated Has no effect. The client splits success from error by status, so axios never throws on a status.
   */
  validateStatus?: (status: number) => boolean
}

export type RequestConfig<TBody = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = Omit<
  core.RequestConfig<TBody, TRequest, TResponse>,
  'transport' | 'client'
> &
  AxiosOverrides & { client?: ClientInstance<TRequest, TResponse> }
export type Options<TData extends core.DataShape, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = Omit<
  core.Options<TData, ThrowOnError, TRequest, TResponse>,
  'transport' | 'client'
> &
  AxiosOverrides & { client?: ClientInstance<TRequest, TResponse> }
export type ClientConfig<TRequest = NativeRequest, TResponse = NativeResponse> = Omit<core.ClientConfig<TRequest, TResponse>, 'transport'> & AxiosOverrides
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

/** An interceptor handler. It receives the native axios object; the second argument is kept for handlers written against earlier versions and is always `undefined`. */
export type InterceptorFn<T> = (value: T, requestConfig?: RequestConfig) => T | Promise<T>

/** Registers, removes, or replaces handlers on axios's own interceptor managers. */
export type InterceptorChannel<T> = {
  use: (fn: InterceptorFn<T>) => number
  eject: (id: number) => void
  update: (id: number, fn: InterceptorFn<T>) => void
}

/** The interceptors of `defaultTransport`: request handlers see the `InternalAxiosRequestConfig`, response handlers the `AxiosResponse`, error handlers the `AxiosError`. */
export type Interceptors = {
  request: InterceptorChannel<InternalAxiosRequestConfig>
  response: InterceptorChannel<AxiosResponse>
  error: InterceptorChannel<AxiosError>
}

export type ClientInstance<TRequest = NativeRequest, TResponse = NativeResponse> = {
  <TBody = unknown>(config: RequestConfig<TBody, TRequest, TResponse>): Promise<CallResult<TRequest, TResponse>>
  getConfig: () => ClientConfig<TRequest, TResponse>
  setConfig: (config: ClientConfig<TRequest, TResponse>) => ClientConfig<TRequest, TResponse>
  getUrl: core.ClientInstance<TRequest, TResponse>['getUrl']
  interceptors: Interceptors
  createClient: (config?: ClientConfig<TRequest, TResponse>) => ClientInstance<TRequest, TResponse>
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

    // In the browser the default adapters pick XHR, which buffers the whole body, so a stream switches to fetch. An adapter set
    // on the call or the instance, and the Node http adapter with its proxy and agent, are kept.
    const defaultAdapter = !instance.defaults?.adapter || String(instance.defaults.adapter) === String(axios.defaults.adapter)
    if (request.responseType === 'stream' && !config.adapter && defaultAdapter && typeof XMLHttpRequest !== 'undefined') config.adapter = 'fetch'

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

function isAxiosInstance(value: unknown): value is AxiosInstance {
  return typeof value === 'function' && 'request' in value && 'interceptors' in value
}

function toTransport<T extends { transport?: AxiosTransport }>(config: T): Omit<T, 'transport'> & { transport?: Transport } {
  return { ...config, transport: isAxiosInstance(config.transport) ? createAxiosTransport(config.transport) : config.transport }
}

/**
 * Maps the kubb interceptor API onto the native managers of `instance`, keeping one id per handler so `eject` and `update`
 * keep working after an `update`.
 */
function nativeInterceptors(instance: AxiosInstance): Interceptors {
  const channel = <T>(eject: (nativeId: number) => void, register: (fn: InterceptorFn<T>) => number): InterceptorChannel<T> => {
    const nativeIds = new Map<number, number>()
    let counter = 0
    return {
      use(fn) {
        const id = ++counter
        nativeIds.set(id, register(fn))
        return id
      },
      eject(id) {
        const nativeId = nativeIds.get(id)
        if (nativeId !== undefined) eject(nativeId)
        nativeIds.delete(id)
      },
      update(id, fn) {
        const nativeId = nativeIds.get(id)
        if (nativeId === undefined) return
        eject(nativeId)
        nativeIds.set(id, register(fn))
      },
    }
  }
  const ejectRequest = (id: number) => instance.interceptors.request.eject(id)
  const ejectResponse = (id: number) => instance.interceptors.response.eject(id)
  return {
    request: channel(ejectRequest, (fn) => instance.interceptors.request.use((config) => fn(config))),
    response: channel(ejectResponse, (fn) => instance.interceptors.response.use((response) => fn(response))),
    error: channel(ejectResponse, (fn) =>
      instance.interceptors.response.use(undefined, async (error: AxiosError) => {
        throw (await fn(error)) ?? error
      }),
    ),
  }
}

/**
 * Wraps a core client for axios callers: an `AxiosInstance` passed as `transport` is wrapped by `createAxiosTransport`,
 * `client.interceptors` registers on `instance`, and `createClient` gives the child its own instance.
 */
function createAxiosClient(instance: AxiosInstance, config: ClientConfig = {}, defaultTransport: Transport = createAxiosTransport(instance)): ClientInstance {
  const inner = core.createClientCore<NativeRequest, NativeResponse>({ defaultTransport, ...toTransport(config) })
  // `client` never reaches the core: the generated operation destructures it before the call.
  const client = ((requestConfig) => inner(toTransport(requestConfig) as core.RequestConfig<unknown, NativeRequest, NativeResponse>)) as ClientInstance
  client.getConfig = inner.getConfig
  client.setConfig = (next) => inner.setConfig(toTransport(next))
  client.getUrl = inner.getUrl
  client.interceptors = nativeInterceptors(instance)
  client.createClient = (next = {}) => createAxiosClient(axios.create(), { ...inner.getConfig(), ...next })
  return client
}

/**
 * The axios instance the generated `client` sends through when no transport is set. Set its defaults or register axios
 * interceptors on it. Instances from `createClient()` get their own.
 */
export const defaultTransport = axios.create()

/**
 * Creates an isolated client. `defaultTransport` is the axios instance to send through, a transport function, or left out
 * for a new `axios.create()`.
 */
export function createClientCore(options: { defaultTransport?: AxiosTransport } & ClientConfig = {}): ClientInstance {
  const { defaultTransport: transport, ...config } = options
  const instance = isAxiosInstance(transport) ? transport : axios.create()
  return createAxiosClient(instance, config, transport && !isAxiosInstance(transport) ? transport : createAxiosTransport(instance))
}

export const client = createAxiosClient(defaultTransport)

export const createClient = (config?: ClientConfig) => client.createClient(config)
