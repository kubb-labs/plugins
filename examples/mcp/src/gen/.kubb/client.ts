import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { type StandardSchemaValidator, validateStandardSchema } from './standardSchema.ts'

/**
 * HTTP status codes treated as a success, everything else is an error.
 */
export type SuccessStatusCode = '200' | '201' | '202' | '203' | '204' | '205' | '206' | '207' | '208' | '226'

/**
 * The success members of a per-status responses record.
 */
export type SuccessOf<TResponses> = TResponses[Extract<keyof TResponses, SuccessStatusCode>]

/**
 * The error members of a per-status responses record, every documented status that is not a 2xx.
 */
export type ErrorOf<TResponses> = TResponses[Exclude<keyof TResponses, SuccessStatusCode>]

/**
 * Converts a response record's string status key to its numeric literal, leaving non-numeric keys like `default` as `number`.
 */
export type ToStatusNumber<TStatus> = TStatus extends `${infer TNumber extends number}` ? TNumber : number

/**
 * The plain body of a per-status response, unwrapping the `{ contentType; data }` union so an error result keeps the bare body union on `error`.
 */
export type DataOf<T> = T extends { contentType: string; data: infer TData } ? TData : T

/**
 * The success variant for a single status, flattened so the negotiated `contentType` sits next to `data` and `switch (result.contentType)` narrows it.
 */
export type SuccessVariant<TStatus, TEntry, TRequest, TResponse> = TEntry extends { contentType: string; data: unknown }
  ? TEntry extends { contentType: infer TContentType; data: infer TData }
    ? { status: ToStatusNumber<TStatus>; data: TData; error: undefined; contentType: TContentType; request: TRequest; response: TResponse }
    : never
  : { status: ToStatusNumber<TStatus>; data: TEntry; error: undefined; contentType: string | undefined; request: TRequest; response: TResponse }

/**
 * One result variant for a single documented status, keyed by the numeric `status` so a `switch (result.status)` narrows `data` or `error`.
 */
export type ResultByStatus<TResponses, TStatus extends keyof TResponses, TRequest, TResponse> = TStatus extends SuccessStatusCode
  ? SuccessVariant<TStatus, TResponses[TStatus], TRequest, TResponse>
  : {
      status: ToStatusNumber<TStatus>
      data: undefined
      error: DataOf<TResponses[TStatus]>
      contentType: string | undefined
      request: TRequest
      response: TResponse
    }

/**
 * The union of every documented status' result variant.
 */
export type ResultUnion<TResponses, TRequest, TResponse> = {
  [TStatus in keyof TResponses]: ResultByStatus<TResponses, TStatus, TRequest, TResponse>
}[keyof TResponses]

/**
 * The union of just the success (2xx) status variants, selected by status code so an untyped error payload can never widen `data`.
 */
export type SuccessResultUnion<TResponses, TRequest, TResponse> = {
  [TStatus in Extract<keyof TResponses, SuccessStatusCode>]: ResultByStatus<TResponses, TStatus, TRequest, TResponse>
}[Extract<keyof TResponses, SuccessStatusCode>]

/**
 * The shape every generated function returns, discriminated by the top-level `status`, narrowing to the 2xx variants under `throwOnError` and to every documented status without it.
 */
export type RequestResult<TResponses, ThrowOnError extends boolean = true, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = ThrowOnError extends true
  ? [SuccessResultUnion<TResponses, TRequest, TResponse>] extends [never]
    ? {
        status: number
        data: SuccessOf<TResponses>
        error: undefined
        contentType: string | undefined
        request: TRequest
        response: TResponse
      }
    : SuccessResultUnion<TResponses, TRequest, TResponse>
  : [ResultUnion<TResponses, TRequest, TResponse>] extends [never]
    ? { status: number; data: undefined; error: undefined; contentType: string | undefined; request: TRequest; response: TResponse }
    : ResultUnion<TResponses, TRequest, TResponse>

/**
 * The data-shaped keys of the grouped options object, which `Options` re-adds typed per operation.
 */
export type DataShape = { body?: unknown; headers?: unknown; path?: unknown; query?: unknown }

export type HeaderValue = string | number | boolean | null | undefined | object
export type HeadersInit = Array<[string, HeaderValue]> | Record<string, HeaderValue>
export type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream' | 'formdata'

/**
 * Serializes the query object into a search string.
 */
export type QuerySerializer = (params: Record<string, unknown>) => string

/**
 * Serializes the request body, passing binary and form bodies through and JSON-serializing the rest.
 */
export type BodySerializer = (body: unknown, contentType?: string) => unknown

/**
 * Turns a raw response body into a parsed value, registered per media type on `deserializers` to handle formats the runtime does not decode itself.
 */
export type Deserializer<T = unknown> = (raw: unknown, contentType: string) => T | Promise<T>

/**
 * The per-call content type selection, where a bare string sets the request content type and the object form also sets the response format sent as `Accept`.
 */
export type ContentType = string | { request?: string; response?: string }

/**
 * A Standard Schema validator (zod, valibot, arktype) that parses a value before it is sent or after it is received.
 */
export type Validator<T = unknown> = StandardSchemaValidator<T>

/**
 * A resolved security scheme carried on each generated call's `security` array and passed to the `auth` resolver.
 */
export type Auth = {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: 'bearer' | 'basic'
  name?: string
  in?: 'header' | 'query' | 'cookie'
}

/**
 * The raw token a consumer returns for a scheme (or `user:password` for basic), or `undefined` to skip it.
 */
export type AuthToken = string | undefined

/**
 * Resolves the token for a security scheme, either a static token or a callback called per scheme until one returns a token.
 */
export type AuthResolver = AuthToken | ((auth: Auth) => AuthToken | Promise<AuthToken>)

/**
 * Extra axios config the runtime spreads onto every request, an escape hatch for per-call fields it does not set itself such as `timeout`, `proxy`, and the progress callbacks.
 */
export type AxiosOptions = AxiosRequestConfig

/**
 * The request a generated function hands to the runtime, with `body` / `headers` / `path` / `query` from the grouped options.
 */
export type RequestConfig<TBody = unknown, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = {
  baseURL?: string
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  path?: Record<string, unknown>
  query?: unknown
  params?: unknown
  body?: TBody
  headers?: HeadersInit
  signal?: AbortSignal
  options?: AxiosOptions
  contentType?: ContentType
  responseType?: ResponseType
  throwOnError?: boolean
  validateStatus?: (status: number) => boolean
  client?: ClientInstance<TRequest, TResponse>
  transport?: AxiosInstance
  querySerializer?: QuerySerializer
  bodySerializer?: BodySerializer
  bodySerializers?: Record<string, BodySerializer>
  deserializers?: Record<string, Deserializer>
  validator?: { request?: Validator; response?: Validator; error?: Validator }
  security?: Array<Auth>
  auth?: AuthResolver
}

/**
 * The grouped options object passed to every generated function: the request config minus the
 * data-shaped keys and the literal `url`, plus the per-operation `<Name>Request`.
 */
export type Options<TData extends DataShape, ThrowOnError extends boolean = true, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = Omit<
  RequestConfig<unknown, TRequest, TResponse>,
  keyof DataShape | 'url'
> &
  TData & {
    client?: ClientInstance<TRequest, TResponse>
    throwOnError?: ThrowOnError
  }

/**
 * Client-level configuration shared by every call an instance makes, overridden by the per-call `RequestConfig`.
 */
export type ClientConfig = {
  baseURL?: string
  headers?: HeadersInit
  options?: AxiosOptions
  throwOnError?: boolean
  validateStatus?: (status: number) => boolean
  transport?: AxiosInstance
  querySerializer?: QuerySerializer
  bodySerializer?: BodySerializer
  bodySerializers?: Record<string, BodySerializer>
  deserializers?: Record<string, Deserializer>
  auth?: AuthResolver
}

/**
 * The result a resolved call produces before it is cast to `RequestResult` by the generated wrapper.
 */
export type CallResult<TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = {
  status: number
  data: unknown
  error: unknown
  contentType: string | undefined
  request: TRequest
  response: TResponse
}

export type InterceptorFn<T> = (value: T) => T | Promise<T>

/**
 * A single interceptor channel with a transport-agnostic `use` / `eject` / `update` API, backed by axios's native interceptor managers.
 */
export type InterceptorChannel<T> = {
  use: (fn: InterceptorFn<T>) => number
  eject: (id: number) => void
  update: (id: number, fn: InterceptorFn<T>) => void
}

/**
 * The three interceptor channels every client instance exposes, wrapping axios's native managers with `error` mapped onto the response rejection handler.
 */
export type Interceptors = {
  request: InterceptorChannel<InternalAxiosRequestConfig>
  response: InterceptorChannel<AxiosResponse>
  error: InterceptorChannel<AxiosError>
}

/**
 * A client instance: the callable send plus configuration, interceptors, and an isolated
 * `createClient` factory.
 */
export type ClientInstance<TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = {
  <TBody = unknown>(config: RequestConfig<TBody, TRequest, TResponse>): Promise<CallResult<TRequest, TResponse>>
  getConfig: () => ClientConfig
  setConfig: (config: ClientConfig) => ClientConfig
  getUrl: <TBody = unknown>(config: RequestConfig<TBody, TRequest, TResponse>) => string
  interceptors: Interceptors
  createClient: (config?: ClientConfig) => ClientInstance<TRequest, TResponse>
}

/**
 * Thrown for a non-2xx response, so a resolved call always means success.
 */
/**
 * One decoded Server-Sent Event, with `data` parsed as JSON when valid and kept as the raw string otherwise.
 */
export type ServerSentEvent<TData = unknown> = {
  data: TData
  event?: string
  id?: string
  retry?: number
}

async function* readBytes(stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>): AsyncGenerator<Uint8Array> {
  if (!('getReader' in stream)) {
    yield* stream
    return
  }

  const reader = stream.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) return
      yield value
    }
  } finally {
    await reader.cancel().catch(() => {})
  }
}

function parseEvent<TData>(raw: string): ServerSentEvent<TData> | undefined {
  const data: Array<string> = []
  const event: ServerSentEvent<TData> = { data: undefined as TData }
  let seen = false

  for (const line of raw.split('\n')) {
    if (!line || line.startsWith(':')) continue
    seen = true
    const index = line.indexOf(':')
    const field = index === -1 ? line : line.slice(0, index)
    const value = index === -1 ? '' : line.slice(index + 1).replace(/^ /, '')
    if (field === 'data') data.push(value)
    else if (field === 'event') event.event = value
    else if (field === 'id') event.id = value
    else if (field === 'retry' && Number.isFinite(Number(value))) event.retry = Number(value)
  }

  if (!seen) return undefined

  if (data.length) {
    const joined = data.join('\n')
    try {
      event.data = JSON.parse(joined) as TData
    } catch {
      event.data = joined as TData
    }
  }
  return event
}

/**
 * Parses a `text/event-stream` body into typed Server-Sent Events, consumed with `for await` and stopped early by breaking the loop.
 */
export async function* parseEventStream<TData = unknown>(
  stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>,
): AsyncGenerator<ServerSentEvent<TData>> {
  const decoder = new TextDecoder()
  const normalize = (text: string) => text.replace(/\r\n|\r/g, '\n')
  let buffer = ''

  for await (const chunk of readBytes(stream)) {
    const blocks = normalize(buffer + decoder.decode(chunk, { stream: true })).split('\n\n')
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      const event = parseEvent<TData>(block)
      if (event) yield event
    }
  }

  const event = parseEvent<TData>(normalize(buffer + decoder.decode()))
  if (event) yield event
}

/**
 * The resolved shape returned by a generated `text/event-stream` operation: the typed event
 * `stream` plus the native `response`.
 */
export type EventStreamResult<TData = unknown, TResponse = AxiosResponse> = {
  stream: AsyncGenerator<ServerSentEvent<TData>>
  response: TResponse
}

/**
 * Wraps a transport result whose `data` is a streaming body into an `EventStreamResult`, exposing
 * the parsed events as a typed async iterator. Generated SSE operations call this.
 */
export async function toEventStream<TData = unknown>(result: Promise<{ data: unknown; response: AxiosResponse }>): Promise<EventStreamResult<TData>> {
  const { data, response } = await result
  return {
    response,
    stream: parseEventStream<TData>(data as ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>),
  }
}

export class ResponseError<TError = unknown, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> extends Error {
  data: TError
  status: number
  statusText: string
  contentType: string | undefined
  request: TRequest
  response: TResponse

  constructor(config: { data: TError; status: number; statusText: string; contentType?: string; request: TRequest; response: TResponse }) {
    super(`Request failed with status ${config.status}${config.statusText ? ` ${config.statusText}` : ''}`)
    this.name = 'ResponseError'
    this.data = config.data
    this.status = config.status
    this.statusText = config.statusText
    this.contentType = config.contentType
    this.request = config.request
    this.response = config.response
  }
}

export type ResponseErrorConfig<TError = unknown> = ResponseError<TError>

function isFormBody(body: unknown): boolean {
  return (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    ArrayBuffer.isView(body) ||
    typeof body === 'string'
  )
}

function appendFormDataValue(formData: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null) return
  if (value instanceof Blob) formData.append(key, value)
  else if (value instanceof Date) formData.append(key, value.toISOString())
  else if (typeof value === 'object') formData.append(key, JSON.stringify(value))
  else formData.append(key, String(value))
}

/**
 * Default body serializer that passes binary and form bodies through, builds `FormData` or `URLSearchParams` for the matching content type, and JSON-serializes the rest.
 */
export const defaultBodySerializer: BodySerializer = (body, contentType) => {
  if (body === undefined || body === null) return undefined
  if (isFormBody(body)) return body
  if (contentType?.includes('multipart/form-data')) {
    const formData = new FormData()
    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      if (Array.isArray(value)) for (const item of value) appendFormDataValue(formData, key, item)
      else appendFormDataValue(formData, key, value)
    }
    return formData
  }
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    return new URLSearchParams(body as Record<string, string>)
  }
  return JSON.stringify(body)
}

function appendQueryValue(search: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null) return
  if (Array.isArray(value)) {
    for (const item of value) appendQueryValue(search, key, item)
    return
  }
  if (typeof value === 'object') {
    for (const [prop, propValue] of Object.entries(value as Record<string, unknown>)) {
      appendQueryValue(search, `${key}[${prop}]`, propValue)
    }
    return
  }
  search.append(key, String(value))
}

/**
 * Default query serializer: arrays explode into repeated keys and nested objects use the
 * `deepObject` style (`key[prop]=value`).
 */
export const defaultQuerySerializer: QuerySerializer = (params) => {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    appendQueryValue(search, key, value)
  }
  return search.toString()
}

function serializeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {}
  const entries = Array.isArray(headers) ? headers : Object.entries(headers)
  const result: Record<string, string> = {}
  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue
    result[key] = typeof value === 'string' ? value : typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
  return result
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>): Record<string, string> {
  return Object.assign({}, ...sources.map(serializeHeaders))
}

/**
 * Joins the URL parts, interpolates URL-encoded `{param}` segments, and appends the serialized query, backing `getUrl`.
 */
function serializeUrl(parts: Array<string | undefined>, pathParams: Record<string, unknown>, search: string): string {
  const path = parts
    .filter(Boolean)
    .join('')
    .replace(/\{([^{}]+)\}/g, (_, key: string) => encodeURIComponent(String(pathParams[key] ?? '')))
  return path + (search ? `?${search}` : '')
}

/**
 * Walks the per-operation security in order and places the first resolved token on the request, mutating `headers` / `query` in place.
 */
export async function resolveAuth(params: {
  security: Array<Auth> | undefined
  auth: AuthResolver | undefined
  headers: Record<string, string>
  query: Record<string, unknown>
}): Promise<void> {
  const { security, auth, headers, query } = params
  if (!security?.length || auth === undefined) return

  for (const scheme of security) {
    const token = typeof auth === 'function' ? await auth(scheme) : auth
    if (token === undefined) continue

    if (scheme.type === 'apiKey') {
      const name = scheme.name ?? 'Authorization'
      if (scheme.in === 'query') query[name] = token
      else if (scheme.in === 'cookie') headers.Cookie = [headers.Cookie, `${name}=${token}`].filter(Boolean).join('; ')
      else headers[name] = token
    } else {
      headers.Authorization = scheme.scheme === 'basic' ? `Basic ${btoa(token)}` : `Bearer ${token}`
    }
    return
  }
}

async function runValidator<T>(validator: Validator<T> | undefined, value: T): Promise<T> {
  if (!validator) return value
  return validateStandardSchema(validator, value)
}

/**
 * Wraps an axios interceptor registration behind the shared `use` / `eject` / `update` API, mapping a stable external id onto axios's own so `update` can swap a handler in place.
 */
function createInterceptorChannel<T>(register: (fn: InterceptorFn<T>) => number, ejectNative: (id: number) => void): InterceptorChannel<T> {
  const ids = new Map<number, number>()
  let counter = 0
  return {
    use(fn) {
      const id = ++counter
      ids.set(id, register(fn))
      return id
    },
    eject(id) {
      const nativeId = ids.get(id)
      if (nativeId === undefined) return
      ejectNative(nativeId)
      ids.delete(id)
    },
    update(id, fn) {
      const nativeId = ids.get(id)
      if (nativeId !== undefined) ejectNative(nativeId)
      ids.set(id, register(fn))
    },
  }
}

/**
 * The base media type of a `Content-Type` value, lowercased and stripped of any `; charset=...` parameters.
 */
function baseContentType(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  return value.split(';')[0]!.trim().toLowerCase() || undefined
}

/**
 * Reads the negotiated response content type from the response headers as a base media type.
 */
function getResponseContentType(headers: Record<string, unknown> | undefined): string | undefined {
  if (!headers) return undefined
  const value = headers['content-type'] ?? headers['Content-Type']
  return baseContentType(typeof value === 'string' ? value : undefined)
}

/**
 * Normalizes the `contentType` option to its `{ request, response }` form, treating a bare string as the request content type.
 */
function resolveContentType(contentType: ContentType | undefined): { request?: string; response?: string } {
  if (typeof contentType === 'string') return { request: contentType }
  return contentType ?? {}
}

/**
 * Builds the shared client core bound to an axios instance (defaulting to `axios.create()`), with `throwOnError` riding axios's `validateStatus`.
 */
export function createClientCore<TRequest = AxiosRequestConfig, TResponse = AxiosResponse>(options: ClientConfig = {}): ClientInstance<TRequest, TResponse> {
  let config: ClientConfig = { ...options }
  const instance = config.transport ?? axios.create()

  const requestManager = instance.interceptors.request
  const responseManager = instance.interceptors.response
  const interceptors: Interceptors = {
    request: createInterceptorChannel<InternalAxiosRequestConfig>(
      (fn) => requestManager.use(fn),
      (id) => requestManager.eject(id),
    ),
    response: createInterceptorChannel<AxiosResponse>(
      (fn) => responseManager.use(fn),
      (id) => responseManager.eject(id),
    ),
    error: createInterceptorChannel<AxiosError>(
      (fn) =>
        responseManager.use(undefined, async (error: unknown) => {
          await fn(error as AxiosError)
          return Promise.reject(error)
        }),
      (id) => responseManager.eject(id),
    ),
  }

  const client = (async <TBody = unknown>(requestConfig: RequestConfig<TBody, TRequest, TResponse>): Promise<CallResult<TRequest, TResponse>> => {
    const activeInstance = requestConfig.transport ?? config.transport ?? instance
    const querySerializer = requestConfig.querySerializer ?? config.querySerializer ?? defaultQuerySerializer
    const bodySerializers = { ...config.bodySerializers, ...requestConfig.bodySerializers }
    const deserializers = { ...config.deserializers, ...requestConfig.deserializers }

    const headers = mergeHeaders(config.headers, requestConfig.headers)
    const { request: requestContentTypeOption, response: responseContentType } = resolveContentType(requestConfig.contentType)
    const requestContentType = requestContentTypeOption ?? headers['Content-Type'] ?? headers['content-type']
    if (responseContentType && headers['Accept'] === undefined && headers['accept'] === undefined) {
      headers['Accept'] = responseContentType
    }

    const query: Record<string, unknown> = { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) }

    await resolveAuth({
      security: requestConfig.security,
      auth: requestConfig.auth ?? config.auth,
      headers,
      query,
    })

    const validatedBody = await runValidator(requestConfig.validator?.request, requestConfig.body)
    const requestContentTypeBase = baseContentType(requestContentType)
    const bodySerializer =
      (requestContentTypeBase && bodySerializers[requestContentTypeBase]) || requestConfig.bodySerializer || config.bodySerializer || defaultBodySerializer
    const body = bodySerializer(validatedBody, requestContentType)
    // A FormData body must keep its Content-Type unset so axios appends the multipart boundary.
    if (body instanceof FormData) {
      delete headers['Content-Type']
      delete headers['content-type']
    } else if (requestContentTypeOption) {
      headers['Content-Type'] = requestContentTypeOption
    }
    const pathParams = requestConfig.path ?? {}
    const url = (requestConfig.url ?? '').replace(/\{([^{}]+)\}/g, (_, key: string) => encodeURIComponent(String(pathParams[key] ?? '')))
    const baseURL = [config.baseURL, requestConfig.baseURL].filter(Boolean).join('') || undefined

    const throwOnError = requestConfig.throwOnError ?? config.throwOnError ?? true
    const validateStatus = requestConfig.validateStatus ?? config.validateStatus ?? (throwOnError ? undefined : () => true)

    const options = config.options || requestConfig.options ? { ...config.options, ...requestConfig.options } : undefined

    const axiosConfig: AxiosRequestConfig = {
      ...options, // timeout, proxy, maxRedirects, decompress, onUploadProgress, …
      url,
      baseURL,
      method: requestConfig.method ?? 'GET',
      headers,
      params: query,
      paramsSerializer: (params) => querySerializer(params as Record<string, unknown>),
      data: body,
      transformRequest: (data) => data,
      signal: requestConfig.signal,
      responseType: requestConfig.responseType,
      validateStatus,
    }

    // Only the fetch adapter exposes a streaming `response.data` (a ReadableStream) in the browser;
    // the default XHR adapter buffers the whole body. Default streams to it, but respect an explicit adapter.
    if (requestConfig.responseType === 'stream' && !axiosConfig.adapter) {
      axiosConfig.adapter = 'fetch'
    }

    try {
      const response = await activeInstance.request<unknown, AxiosResponse>(axiosConfig)
      const isSuccess = response.status >= 200 && response.status < 300
      const contentType = getResponseContentType(response.headers as Record<string, unknown>)
      let decoded: unknown = response.data
      if (contentType) {
        const deserialize = deserializers[contentType]
        if (deserialize) decoded = await deserialize(response.data, contentType)
      }
      const data = isSuccess ? await runValidator(requestConfig.validator?.response, decoded) : undefined
      const error = isSuccess ? undefined : await runValidator(requestConfig.validator?.error, decoded)
      return {
        status: response.status,
        data,
        error,
        contentType,
        request: response.config as TRequest,
        response: response as TResponse,
      }
    } catch (error) {
      const axiosError = error as AxiosError
      if (throwOnError && axiosError.response) {
        throw new ResponseError({
          data: axiosError.response.data,
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          contentType: getResponseContentType(axiosError.response.headers as Record<string, unknown>),
          request: axiosError.config as TRequest,
          response: axiosError.response as TResponse,
        })
      }
      throw error
    }
  }) as ClientInstance<TRequest, TResponse>

  client.getConfig = () => config
  client.setConfig = (next) => {
    config = { ...config, ...next, headers: { ...serializeHeaders(config.headers), ...serializeHeaders(next.headers) } }
    return config
  }
  client.getUrl = (requestConfig) => {
    const querySerializer = requestConfig.querySerializer ?? config.querySerializer ?? defaultQuerySerializer
    const query: Record<string, unknown> = { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) }
    return serializeUrl([config.baseURL, requestConfig.baseURL, requestConfig.url], requestConfig.path ?? {}, querySerializer(query))
  }
  client.interceptors = interceptors
  client.createClient = (next) => createClientCore<TRequest, TResponse>({ ...config, ...next })

  return client
}

export const client = createClientCore()

export const createClient = (config?: Parameters<typeof client.createClient>[0]) => client.createClient(config)
client.setConfig({ baseURL: 'https://petstore.swagger.io/v2' })
