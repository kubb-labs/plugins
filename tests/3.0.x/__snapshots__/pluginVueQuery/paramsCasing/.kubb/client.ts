import axios from 'axios'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

/**
 * HTTP status codes treated as a success. A resolved call only ever carries a body from one of
 * these; everything else is an error (thrown by default, or surfaced on `error`).
 */
export type SuccessStatusCode = '200' | '201' | '202' | '203' | '204' | '205' | '206' | '207' | '208' | '226'

/**
 * The success members of a per-status responses record (`{ '200': ...; '404': ... }`).
 */
export type SuccessOf<TResponses> = TResponses[Extract<keyof TResponses, SuccessStatusCode>]

/**
 * The error members of a per-status responses record — every documented status that is not a 2xx.
 */
export type ErrorOf<TResponses> = TResponses[Exclude<keyof TResponses, SuccessStatusCode>]

/**
 * Converts a response record's string status key to its numeric literal (`'200'` becomes `200`).
 * Non-numeric keys such as the OpenAPI `default` response stay `number`.
 */
export type ToStatusNumber<TStatus> = TStatus extends `${infer TNumber extends number}` ? TNumber : number

/**
 * One result variant for a single documented status. `status` is the numeric literal at the top
 * level, so a `switch (result.status)` narrows `data` (a 2xx status) or `error` (everything else) to
 * that status's payload.
 */
export type ResultByStatus<TResponses, TStatus extends keyof TResponses, TRequest, TResponse> = TStatus extends SuccessStatusCode
  ? { status: ToStatusNumber<TStatus>; data: TResponses[TStatus]; error: undefined; request: TRequest; response: TResponse }
  : { status: ToStatusNumber<TStatus>; data: undefined; error: TResponses[TStatus]; request: TRequest; response: TResponse }

/**
 * The union of every documented status' result variant.
 */
export type ResultUnion<TResponses, TRequest, TResponse> = {
  [TStatus in keyof TResponses]: ResultByStatus<TResponses, TStatus, TRequest, TResponse>
}[keyof TResponses]

/**
 * The shape every generated function returns, discriminated by the top-level `status`. With
 * `throwOnError` (the default) a resolved call always means success, so the result is the union of the
 * 2xx variants and `error` is `undefined`; without it every documented status is a variant, so a
 * `switch (result.status)` (or narrowing on `error`) narrows `data` and `error` to that status's
 * payload. Operations with no typed responses fall back to a `status`/`request`/`response`-only result.
 */
export type RequestResult<TResponses, ThrowOnError extends boolean = true, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = ThrowOnError extends true
  ? [Extract<ResultUnion<TResponses, TRequest, TResponse>, { error: undefined }>] extends [never]
    ? { status: number; data: undefined; error: undefined; request: TRequest; response: TResponse }
    : Extract<ResultUnion<TResponses, TRequest, TResponse>, { error: undefined }>
  : [ResultUnion<TResponses, TRequest, TResponse>] extends [never]
    ? { status: number; data: undefined; error: undefined; request: TRequest; response: TResponse }
    : ResultUnion<TResponses, TRequest, TResponse>

/**
 * The data-shaped keys of the grouped options object. `Options` subtracts these from the runtime
 * `RequestConfig` and adds them back, typed per operation, from the generated `<Name>Request` type.
 */
export type DataShape = { body?: unknown; headers?: unknown; path?: unknown; query?: unknown }

export type HeaderValue = string | number | boolean | null | undefined | object
export type HeadersInit = Array<[string, HeaderValue]> | Record<string, HeaderValue>
export type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream' | 'formdata'

/**
 * Serializes the query object into a search string. Array and object members follow the configured
 * style (`form` with `explode` by default; `deepObject` for nested objects).
 */
export type QuerySerializer = (params: Record<string, unknown>) => string

/**
 * Serializes the request body. JSON by default; `FormData`, `URLSearchParams`, `Blob`,
 * `ArrayBuffer`, and string bodies pass through untouched.
 */
export type BodySerializer = (body: unknown, contentType?: string) => unknown

/**
 * Parses a value before it is sent or after it is received, returning the parsed (and optionally
 * transformed) value. Wires zod parsing through the per-call `parser.request` / `parser.response` hooks.
 */
export type Parser<T = unknown> = (value: T) => T | Promise<T>

/**
 * A single OpenAPI security requirement: scheme name to the scopes it needs.
 */
export type SecurityRequirement = Record<string, Array<string>>

/**
 * A resolved security scheme, narrowed to the kinds the runtime can place on a request.
 */
export type SecurityScheme = { type: 'http'; scheme: 'bearer' } | { type: 'http'; scheme: 'basic' } | { type: 'apiKey'; name: string; in: 'header' | 'query' }

/**
 * Credential a consumer returns for a scheme. A string is used directly (bearer token, api key);
 * the object form is encoded as HTTP basic credentials.
 */
export type AuthCredential = string | { username: string; password: string } | undefined

/**
 * Resolves the credential for a security scheme. Called once per scheme on a guarded operation.
 */
export type AuthCallback = (params: { schemeName: string; scopes: Array<string> }) => AuthCredential | Promise<AuthCredential>

/**
 * The request a generated function hands to the runtime. `body` / `headers` / `path` / `query` come
 * from the grouped options; everything else is plain request configuration. `transport` carries an
 * axios instance and `validateStatus` rides axios's own contract.
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
  contentType?: string
  responseType?: ResponseType
  throwOnError?: boolean
  validateStatus?: (status: number) => boolean
  client?: ClientInstance<TRequest, TResponse>
  transport?: AxiosInstance
  querySerializer?: QuerySerializer
  bodySerializer?: BodySerializer
  parser?: { request?: Parser; response?: Parser }
  security?: Array<SecurityRequirement>
  schemes?: Record<string, SecurityScheme>
  auth?: AuthCallback
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
 * Client-level configuration shared by every call an instance makes. Per-call `RequestConfig`
 * overrides these. `transport` is the axios instance the client sends through.
 */
export type ClientConfig = {
  baseURL?: string
  headers?: HeadersInit
  throwOnError?: boolean
  validateStatus?: (status: number) => boolean
  transport?: AxiosInstance
  querySerializer?: QuerySerializer
  bodySerializer?: BodySerializer
  schemes?: Record<string, SecurityScheme>
  auth?: AuthCallback
}

/**
 * The result a resolved call produces before it is cast to `RequestResult` by the generated wrapper.
 */
export type CallResult<TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = {
  status: number
  data: unknown
  error: unknown
  request: TRequest
  response: TResponse
}

/**
 * An interceptor function for a channel value.
 */
export type InterceptorFn<T> = (value: T) => T | Promise<T>

/**
 * A single interceptor channel (request, response, or error) exposing the `use` / `eject` / `update`
 * API shared with the fetch and ky runtimes, backed by axios's native interceptor managers.
 */
export type InterceptorChannel<T> = {
  use: (fn: InterceptorFn<T>) => number
  eject: (id: number) => void
  update: (id: number, fn: InterceptorFn<T>) => void
}

/**
 * The three interceptor channels every client instance exposes, wrapping axios's native
 * `interceptors.request` / `interceptors.response`. The `error` channel maps onto the response
 * manager's rejection handler.
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
  interceptors: Interceptors
  createClient: (config?: ClientConfig) => ClientInstance<TRequest, TResponse>
}

/**
 * Thrown for responses outside the 2xx range, so a resolved call always means success. The parsed
 * error body and the native request config / response stay reachable on the error.
 */
export class ResponseError<TError = unknown, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> extends Error {
  data: TError
  status: number
  statusText: string
  request: TRequest
  response: TResponse

  constructor(config: { data: TError; status: number; statusText: string; request: TRequest; response: TResponse }) {
    super(`Request failed with status ${config.status}${config.statusText ? ` ${config.statusText}` : ''}`)
    this.name = 'ResponseError'
    this.data = config.data
    this.status = config.status
    this.statusText = config.statusText
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

/**
 * Default body serializer: passes binary/form bodies through and JSON-serializes everything else.
 * For `application/x-www-form-urlencoded` plain objects become `URLSearchParams`.
 */
export const defaultBodySerializer: BodySerializer = (body, contentType) => {
  if (body === undefined || body === null) return undefined
  if (isFormBody(body)) return body
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
 * Walks the per-operation security requirements and places each resolved credential on the request,
 * mutating `headers` / `query` in place. Schemes with no resolved credential are skipped, and a
 * requirement is satisfied as soon as one of its schemes resolves.
 */
export async function resolveAuth(params: {
  security: Array<SecurityRequirement> | undefined
  schemes: Record<string, SecurityScheme> | undefined
  auth: AuthCallback | undefined
  headers: Record<string, string>
  query: Record<string, unknown>
}): Promise<void> {
  const { security, schemes, auth, headers, query } = params
  if (!security?.length || !auth) return

  for (const requirement of security) {
    let satisfied = false
    for (const [schemeName, scopes] of Object.entries(requirement)) {
      const credential = await auth({ schemeName, scopes })
      if (credential === undefined) continue

      const scheme = schemes?.[schemeName]
      if (scheme?.type === 'apiKey') {
        if (scheme.in === 'query') query[scheme.name] = credential as string
        else headers[scheme.name] = credential as string
      } else if (scheme?.type === 'http' && scheme.scheme === 'basic' && typeof credential === 'object') {
        headers.Authorization = `Basic ${btoa(`${credential.username}:${credential.password}`)}`
      } else {
        headers.Authorization = `Bearer ${credential as string}`
      }
      satisfied = true
    }
    if (satisfied) break
  }
}

async function runParser<T>(parser: Parser | undefined, value: T): Promise<T> {
  if (!parser) return value
  return (await parser(value)) as T
}

/**
 * Wraps an axios interceptor registration behind the shared `use` / `eject` / `update` API. A stable
 * external id is mapped onto axios's own id so `update` can swap a handler in place even though axios
 * has no native update.
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
 * Builds the shared client core bound to an axios instance (defaulting to `axios.create()`). The
 * interceptor channels delegate to the instance's native managers, and `querySerializer` /
 * `bodySerializer` map onto `paramsSerializer` / `transformRequest`.
 *
 * `throwOnError` rides `validateStatus`. With it on, axios rejects a non-2xx status and the runtime
 * normalizes the error to `ResponseError`. With it off, an internal `validateStatus: () => true`
 * resolves every status into `{ data, error, request, response }`.
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
    const bodySerializer = requestConfig.bodySerializer ?? config.bodySerializer ?? defaultBodySerializer

    const headers = mergeHeaders(config.headers, requestConfig.headers)
    if (requestConfig.contentType && requestConfig.contentType !== 'multipart/form-data') {
      headers['Content-Type'] = requestConfig.contentType
    }
    const contentType = headers['Content-Type'] ?? headers['content-type']

    const query: Record<string, unknown> = { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) }

    await resolveAuth({
      security: requestConfig.security,
      schemes: requestConfig.schemes ?? config.schemes,
      auth: requestConfig.auth ?? config.auth,
      headers,
      query,
    })

    const validatedBody = await runParser(requestConfig.parser?.request, requestConfig.body)
    const pathParams = requestConfig.path ?? {}
    const url = (requestConfig.url ?? '').replace(/\{([^{}]+)\}/g, (_, key: string) => encodeURIComponent(String(pathParams[key] ?? '')))
    const baseURL = [config.baseURL, requestConfig.baseURL].filter(Boolean).join('') || undefined

    const throwOnError = requestConfig.throwOnError ?? config.throwOnError ?? true
    const validateStatus = requestConfig.validateStatus ?? config.validateStatus ?? (throwOnError ? undefined : () => true)

    const axiosConfig: AxiosRequestConfig = {
      url,
      baseURL,
      method: requestConfig.method ?? 'GET',
      headers,
      params: query,
      paramsSerializer: (params) => querySerializer(params as Record<string, unknown>),
      data: validatedBody,
      transformRequest: (data) => bodySerializer(data, contentType),
      signal: requestConfig.signal,
      responseType: requestConfig.responseType,
      validateStatus,
    }

    try {
      const response = await activeInstance.request<unknown, AxiosResponse>(axiosConfig)
      const isSuccess = response.status >= 200 && response.status < 300
      const data = isSuccess ? await runParser(requestConfig.parser?.response, response.data) : undefined
      return {
        status: response.status,
        data,
        error: isSuccess ? undefined : response.data,
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
  client.interceptors = interceptors
  client.createClient = (next) => createClientCore<TRequest, TResponse>({ ...config, ...next })

  return client
}

export const client = createClientCore()

export const createClient = (config?: Parameters<typeof client.createClient>[0]) => client.createClient(config)