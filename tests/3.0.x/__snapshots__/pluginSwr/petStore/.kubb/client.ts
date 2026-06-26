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
 * The union of just the success (2xx) status variants. Selected by status code, not by `error`, so an
 * untyped (`any`) error payload can never widen a success result's `data`.
 */
export type SuccessResultUnion<TResponses, TRequest, TResponse> = {
  [TStatus in Extract<keyof TResponses, SuccessStatusCode>]: ResultByStatus<TResponses, TStatus, TRequest, TResponse>
}[Extract<keyof TResponses, SuccessStatusCode>]

/**
 * The shape every generated function returns, discriminated by the top-level `status`. With
 * `throwOnError` (the default) a resolved call always means success, so the result is the union of the
 * 2xx variants and `error` is `undefined`; without it every documented status is a variant, so a
 * `switch (result.status)` (or narrowing on `error`) narrows `data` and `error` to that status's
 * payload. Operations with no typed responses fall back to a `status`/`request`/`response`-only result.
 */
export type RequestResult<TResponses, ThrowOnError extends boolean = true, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = ThrowOnError extends true
  ? [SuccessResultUnion<TResponses, TRequest, TResponse>] extends [never]
    ? { status: number; data: SuccessOf<TResponses>; error: undefined; request: TRequest; response: TResponse }
    : SuccessResultUnion<TResponses, TRequest, TResponse>
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
 * The OpenAPI path-parameter serialization style. `simple` is the default and emits the bare value;
 * `label` prefixes a `.` and `matrix` prefixes a `;name=` segment.
 */
export type PathStyle = 'simple' | 'label' | 'matrix'

/**
 * The per-parameter serialization metadata carried by the generated request. `style` selects the
 * OpenAPI style and `explode` controls how arrays and objects expand.
 */
export type PathParamStyle = {
  style?: PathStyle
  explode?: boolean
}

/**
 * Serializes a single path parameter for interpolation into the URL, honoring the OpenAPI `style` /
 * `explode` passed as `options`. Defaults to `simple` style with `explode: false`: primitives are
 * URL-encoded, arrays join their members with commas, and objects flatten to `key,value` pairs.
 */
export type PathSerializer = (name: string, value: unknown, options?: PathParamStyle) => string

/**
 * The per-concern serializers, grouped so they can be set in one place and overridden per client or
 * per call. Each field falls back to the matching `default*Serializer` when omitted.
 */
export type Serializers = {
  query?: QuerySerializer
  body?: BodySerializer
  path?: PathSerializer
}

/**
 * Parses a value before it is sent or after it is received, returning the parsed (and optionally
 * transformed) value. Wires zod parsing through the per-call `parser.request` / `parser.response` /
 * `parser.error` hooks (`error` runs on the error body when a non-2xx call does not throw).
 */
export type Parser<T = unknown> = (value: T) => T | Promise<T>

/**
 * A resolved security scheme carried on each generated call's `security` array. The runtime passes it
 * to the configured `auth` resolver and places the returned token accordingly.
 */
export type Auth = {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: 'bearer' | 'basic'
  name?: string
  in?: 'header' | 'query' | 'cookie'
}

/**
 * The token a consumer returns for a scheme, or `undefined` to skip it. Bearer and basic schemes are
 * prefixed by the runtime (basic is base64-encoded), so return the raw token or `user:password`.
 */
export type AuthToken = string | undefined

/**
 * Resolves the token for a security scheme: either a static token used for every scheme, or a
 * callback called once per scheme on a guarded operation until one returns a token.
 */
export type AuthResolver = AuthToken | ((auth: Auth) => AuthToken | Promise<AuthToken>)

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
  pathStyles?: Record<string, PathParamStyle>
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
  serializer?: Serializers
  parser?: { request?: Parser; response?: Parser; error?: Parser }
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
 * Client-level configuration shared by every call an instance makes. Per-call `RequestConfig`
 * overrides these. `transport` is the axios instance the client sends through.
 */
export type ClientConfig = {
  baseURL?: string
  headers?: HeadersInit
  throwOnError?: boolean
  validateStatus?: (status: number) => boolean
  transport?: AxiosInstance
  serializer?: Serializers
  auth?: AuthResolver
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
  getUrl: <TBody = unknown>(config: RequestConfig<TBody, TRequest, TResponse>) => string
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

function appendFormDataValue(formData: FormData, key: string, value: unknown): void {
  if (value === undefined || value === null) return
  if (value instanceof Blob) formData.append(key, value)
  else if (value instanceof Date) formData.append(key, value.toISOString())
  else if (typeof value === 'object') formData.append(key, JSON.stringify(value))
  else formData.append(key, String(value))
}

/**
 * Default body serializer: passes binary/form bodies through and JSON-serializes everything else.
 * For `multipart/form-data` plain objects become `FormData` and for
 * `application/x-www-form-urlencoded` they become `URLSearchParams`.
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

function encodePathValue(value: unknown): string {
  return encodeURIComponent(String(value))
}

function serializePathPrimitive(name: string, value: unknown, style: PathStyle): string {
  const encoded = encodePathValue(value)
  if (style === 'label') return `.${encoded}`
  if (style === 'matrix') return `;${name}=${encoded}`
  return encoded
}

function serializePathArray(name: string, value: Array<unknown>, style: PathStyle, explode: boolean): string {
  const items = value.map(encodePathValue)
  if (style === 'label') return `.${items.join(explode ? '.' : ',')}`
  if (style === 'matrix') return explode ? items.map((item) => `;${name}=${item}`).join('') : `;${name}=${items.join(',')}`
  return items.join(',')
}

function serializePathObject(name: string, value: Record<string, unknown>, style: PathStyle, explode: boolean): string {
  const entries = Object.entries(value)
  const pairs = entries.map(([key, item]) => `${encodePathValue(key)}=${encodePathValue(item)}`)
  const flat = entries.map(([key, item]) => `${encodePathValue(key)},${encodePathValue(item)}`)
  if (style === 'label') return `.${explode ? pairs.join('.') : flat.join(',')}`
  if (style === 'matrix') return explode ? pairs.map((pair) => `;${pair}`).join('') : `;${name}=${flat.join(',')}`
  return (explode ? pairs : flat).join(',')
}

/**
 * Default path serializer honoring the OpenAPI `style` / `explode` metadata. Without metadata it
 * falls back to `simple` style with `explode: false`. Replaces the previous `String(value)`
 * interpolation, which emitted `[object Object]` for object path params.
 */
export const defaultPathSerializer: PathSerializer = (name, value, options) => {
  if (value === undefined || value === null) return ''
  const style = options?.style ?? 'simple'
  const explode = options?.explode ?? false
  if (Array.isArray(value)) return serializePathArray(name, value, style, explode)
  if (typeof value === 'object') return serializePathObject(name, value as Record<string, unknown>, style, explode)
  return serializePathPrimitive(name, value, style)
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
 * Joins the base and request URL parts, interpolates `{param}` segments from the path params
 * (URL-encoded), and appends the serialized query. Backs `getUrl` so a URL can be constructed
 * without sending the request.
 */
function serializeUrl(
  parts: Array<string | undefined>,
  pathParams: Record<string, unknown>,
  search: string,
  pathSerializer: PathSerializer = defaultPathSerializer,
  pathStyles?: Record<string, PathParamStyle>,
): string {
  const path = parts
    .filter(Boolean)
    .join('')
    .replace(/\{([^{}]+)\}/g, (_, key: string) => pathSerializer(key, pathParams[key], pathStyles?.[key]))
  return path + (search ? `?${search}` : '')
}

/**
 * Walks the per-operation security in order and places the first resolved token on the request,
 * mutating `headers` / `query` in place. Bearer (and oauth2 / openIdConnect) tokens become a `Bearer`
 * Authorization header, basic credentials are base64-encoded, and an apiKey is placed under its
 * `name` in the header, query, or cookie.
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
    const querySerializer = requestConfig.serializer?.query ?? config.serializer?.query ?? defaultQuerySerializer
    const bodySerializer = requestConfig.serializer?.body ?? config.serializer?.body ?? defaultBodySerializer
    const pathSerializer = requestConfig.serializer?.path ?? config.serializer?.path ?? defaultPathSerializer

    const headers = mergeHeaders(config.headers, requestConfig.headers)
    const requestContentType = requestConfig.contentType ?? headers['Content-Type'] ?? headers['content-type']

    const query: Record<string, unknown> = { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) }

    await resolveAuth({
      security: requestConfig.security,
      auth: requestConfig.auth ?? config.auth,
      headers,
      query,
    })

    const validatedBody = await runParser(requestConfig.parser?.request, requestConfig.body)
    const body = bodySerializer(validatedBody, requestContentType)
    // A FormData body must keep its Content-Type unset so axios appends the multipart boundary.
    if (body instanceof FormData) {
      delete headers['Content-Type']
      delete headers['content-type']
    } else if (requestConfig.contentType) {
      headers['Content-Type'] = requestConfig.contentType
    }
    const pathParams = requestConfig.path ?? {}
    const url = (requestConfig.url ?? '').replace(/\{([^{}]+)\}/g, (_, key: string) => pathSerializer(key, pathParams[key], requestConfig.pathStyles?.[key]))
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
      data: body,
      transformRequest: (data) => data,
      signal: requestConfig.signal,
      responseType: requestConfig.responseType,
      validateStatus,
    }

    try {
      const response = await activeInstance.request<unknown, AxiosResponse>(axiosConfig)
      const isSuccess = response.status >= 200 && response.status < 300
      const data = isSuccess ? await runParser(requestConfig.parser?.response, response.data) : undefined
      const error = isSuccess ? undefined : await runParser(requestConfig.parser?.error, response.data)
      return {
        status: response.status,
        data,
        error,
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
  client.getUrl = (requestConfig) => {
    const querySerializer = requestConfig.serializer?.query ?? config.serializer?.query ?? defaultQuerySerializer
    const pathSerializer = requestConfig.serializer?.path ?? config.serializer?.path ?? defaultPathSerializer
    const query: Record<string, unknown> = { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) }
    return serializeUrl(
      [config.baseURL, requestConfig.baseURL, requestConfig.url],
      requestConfig.path ?? {},
      querySerializer(query),
      pathSerializer,
      requestConfig.pathStyles,
    )
  }
  client.interceptors = interceptors
  client.createClient = (next) => createClientCore<TRequest, TResponse>({ ...config, ...next })

  return client
}

export const client = createClientCore()

export const createClient = (config?: Parameters<typeof client.createClient>[0]) => client.createClient(config)