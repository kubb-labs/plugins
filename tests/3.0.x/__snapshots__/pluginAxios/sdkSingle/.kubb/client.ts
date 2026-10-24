import axios from 'axios'
import type { HeadersInit, PathParamStyle, PathSerializer, Serializers, Styles } from './serializers'
import type { StandardSchemaValidator } from './standardSchema'
import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { applyHeaderStyles, defaultBodySerializer, defaultPathSerializer, defaultQuerySerializer, isDefaultJsonBody, serializeCookies } from './serializers'
import { ParseError, validateStandardSchema } from './standardSchema'

/**
 * HTTP status codes treated as a success, everything else is an error.
 */
export type SuccessStatusCode = '200' | '201' | '202' | '203' | '204' | '205' | '206' | '207' | '208' | '226'

export type SuccessOf<TResponses> = TResponses[Extract<keyof TResponses, SuccessStatusCode>]

export type ErrorOf<TResponses> = TResponses[Exclude<keyof TResponses, SuccessStatusCode>]

/**
 * Converts a response record's string status key to its numeric literal, leaving non-numeric keys like `default` as `number`.
 */
export type ToStatusNumber<TStatus> = TStatus extends `${infer TNumber extends number}` ? TNumber : number

/**
 * Unwraps content-type variants to keep the bare body on `error`.
 */
export type DataOf<T> = T extends { contentType: string; data: infer TData } ? TData : T

/**
 * Keeps `contentType` beside `data` so switching on it narrows the body.
 */
export type SuccessVariant<TStatus, TEntry, TRequest, TResponse> = TEntry extends { contentType: string; data: unknown }
  ? TEntry extends { contentType: infer TContentType; data: infer TData }
    ? { status: ToStatusNumber<TStatus>; data: TData; error: undefined; contentType: TContentType; request: TRequest; response: TResponse }
    : never
  : { status: ToStatusNumber<TStatus>; data: TEntry; error: undefined; contentType: string | undefined; request: TRequest; response: TResponse }

/**
 * Narrows `data` or `error` when switching on the numeric status.
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

export type ResultUnion<TResponses, TRequest, TResponse> = {
  [TStatus in keyof TResponses]: ResultByStatus<TResponses, TStatus, TRequest, TResponse>
}[keyof TResponses]

/**
 * Selects success statuses without letting untyped error payloads widen `data`.
 */
export type SuccessResultUnion<TResponses, TRequest, TResponse> = {
  [TStatus in Extract<keyof TResponses, SuccessStatusCode>]: ResultByStatus<TResponses, TStatus, TRequest, TResponse>
}[Extract<keyof TResponses, SuccessStatusCode>]

/**
 * Narrows `data` and `error` by status. With `throwOnError`, includes only success variants.
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
 * A `RequestResult` promise with an extra `unwrap()` method that resolves to the success body.
 */
export type Unwrappable<T extends { data: unknown; error: unknown }> = Promise<T> & {
  unwrap: () => Promise<Extract<T, { error: undefined }>['data']>
}

/**
 * Attaches `unwrap()` to a result promise, which rejects with `error` when the result carried one.
 *
 * @example
 * ```ts
 * const { data, error } = await getPetById({ path: { petId: 1 } })
 * ```
 *
 * @example
 * ```ts
 * const pet = await getPetById({ path: { petId: 1 } }).unwrap()
 * ```
 */
export function withUnwrap<T extends { data: unknown; error: unknown }>(promise: Promise<T>): Unwrappable<T> {
  const unwrappable = promise as Unwrappable<T>
  unwrappable.unwrap = () =>
    promise.then((result) => {
      if (result.error !== undefined) throw result.error
      return result.data as Extract<T, { error: undefined }>['data']
    })
  return unwrappable
}

/**
 * The shape a generated operation returns with `returnType: 'data'`: the success body when
 * `throwOnError` is true, or the full `RequestResult` when it is false.
 */
export type UnwrappedResult<
  TResponses,
  ThrowOnError extends boolean = true,
  TRequest = AxiosRequestConfig,
  TResponse = AxiosResponse,
> = ThrowOnError extends true ? RequestResult<TResponses, true, TRequest, TResponse>['data'] : RequestResult<TResponses, ThrowOnError, TRequest, TResponse>

/**
 * Returns the success body when `throwOnError` is true, or the full result when it is false.
 */
export function unwrapResult<T extends { data: unknown; error: unknown }>(promise: Promise<T>, throwOnError: boolean | undefined): Promise<T | T['data']> {
  return promise.then((result) => ((throwOnError ?? true) ? result.data : result))
}

export type DataShape = { body?: unknown; cookies?: unknown; headers?: unknown; path?: unknown; query?: unknown }

export type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream' | 'formdata'

/**
 * Decodes a response body for a codec's media type.
 */
export type Deserializer<T = unknown> = (raw: unknown, contentType: string) => T | Promise<T>

/**
 * Encodes a request body for a codec's media type.
 */
export type ContentBodySerializer = (body: unknown, contentType?: string) => unknown

/**
 * Encodes requests or decodes responses for a media type. Either direction can be omitted.
 */
export type Codec = {
  serialize?: ContentBodySerializer
  deserialize?: Deserializer
}

/**
 * A string sets the request content type. The object form can also set `Accept`.
 */
export type ContentType = string | { request?: string; response?: string }

/**
 * Validates request bodies and params, success bodies, or non-throwing error bodies with Standard Schema.
 */
export type Validator<T = unknown> = StandardSchemaValidator<T>

/**
 * Identifies the value and request that failed validation in `onValidationError`.
 */
export type ValidationErrorContext = {
  value: unknown
  direction: 'request' | 'response' | 'error'
  source: 'body' | 'path' | 'query' | 'headers'
  method?: string
  url?: string
  status?: number
}

/**
 * Return `{ value }` to substitute a failed value, including `undefined`. Returning nothing rethrows the `ParseError`.
 */
export type ValidationErrorHandler = (error: ParseError, context: ValidationErrorContext) => { value: unknown } | void | Promise<{ value: unknown } | void>

/**
 * A resolved security scheme carried on each generated call's `security` array and passed to the `auth` resolver.
 */
export type Auth = {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: 'bearer' | 'basic'
  name?: string
  in?: 'header' | 'query' | 'cookie'
  scopes?: Array<string>
}

/**
 * Return `user:password` for basic auth, or `undefined` to skip a scheme.
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

export type RequestConfig<TBody = unknown, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = {
  baseURL?: string
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'QUERY'
  path?: unknown
  query?: unknown
  params?: unknown
  cookies?: unknown
  body?: TBody
  headers?: unknown
  styles?: Styles
  signal?: AbortSignal
  options?: AxiosOptions
  contentType?: ContentType
  responseType?: ResponseType
  throwOnError?: boolean
  validateStatus?: (status: number) => boolean
  client?: ClientInstance<TRequest, TResponse>
  transport?: AxiosInstance
  serializer?: Serializers
  codecs?: Record<string, Codec>
  validator?: { request?: Validator; path?: Validator; query?: Validator; headers?: Validator; response?: Validator; error?: Validator }
  onValidationError?: ValidationErrorHandler
  security?: Array<Auth>
  auth?: AuthResolver
}

/**
 * Combines client options with the operation's typed request params and body.
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
  serializer?: Serializers
  codecs?: Record<string, Codec>
  onValidationError?: ValidationErrorHandler
  auth?: AuthResolver
}

export type CallResult<TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = {
  status: number
  data: unknown
  error: unknown
  contentType: string | undefined
  request: TRequest
  response: TResponse
}

export type InterceptorFn<T, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = (
  value: T,
  requestConfig?: RequestConfig<unknown, TRequest, TResponse>,
) => T | Promise<T>

/**
 * Registers, removes, or replaces handlers on axios's native interceptor managers.
 */
export type InterceptorChannel<T, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = {
  use: (fn: InterceptorFn<T, TRequest, TResponse>) => number
  eject: (id: number) => void
  update: (id: number, fn: InterceptorFn<T, TRequest, TResponse>) => void
}

/**
 * Maps error interceptors to axios's response rejection handler.
 */
export type Interceptors<TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = {
  request: InterceptorChannel<InternalAxiosRequestConfig, TRequest, TResponse>
  response: InterceptorChannel<AxiosResponse, TRequest, TResponse>
  error: InterceptorChannel<AxiosError, TRequest, TResponse>
}

export type UrlConfig = Pick<RequestConfig, 'baseURL' | 'url' | 'path' | 'query' | 'params' | 'serializer' | 'styles'>

/**
 * A client instance: the callable send plus configuration, interceptors, and an isolated
 * `createClient` factory.
 */
export type ClientInstance<TRequest = AxiosRequestConfig, TResponse = AxiosResponse> = {
  <TBody = unknown>(config: RequestConfig<TBody, TRequest, TResponse>): Promise<CallResult<TRequest, TResponse>>
  getConfig: () => ClientConfig
  setConfig: (config: ClientConfig) => ClientConfig
  getUrl: (config: UrlConfig) => string
  interceptors: Interceptors<TRequest, TResponse>
  createClient: (config?: ClientConfig) => ClientInstance<TRequest, TResponse>
}

/**
 * Thrown for a non-2xx response, so a resolved call always means success.
 */
export class ResponseError<TError = unknown, TRequest = AxiosRequestConfig, TResponse = AxiosResponse> extends Error {
  data: TError
  status: number
  statusText: string
  contentType: string | undefined
  request: TRequest
  response: TResponse

  constructor(config: {
    data: TError
    status: number
    statusText: string
    contentType?: string
    request: TRequest
    response: TResponse
    method?: string
    url?: string
  }) {
    // The query and hash are left out: sensitive query parameters or fragments must not reach logs.
    const cleanUrl = config.url?.split(/[?#]/)[0]
    const target = [config.method, cleanUrl].filter(Boolean).join(' ')
    const statusText = config.statusText?.trim()
    super(`${target ? `${target} failed` : 'Request failed'} with status ${config.status}${statusText ? ` ${statusText}` : ''}`)
    this.name = 'ResponseError'
    this.data = config.data
    this.status = config.status
    this.statusText = config.statusText
    this.contentType = config.contentType
    this.request = config.request
    this.response = config.response
  }

  /**
   * Matches on `name`, not `instanceof`: every generated client bundles its own `ResponseError` class.
   */
  static is(error: unknown): error is ResponseError<unknown, unknown, unknown> {
    return error instanceof Error && error.name === 'ResponseError'
  }
}

export type ResponseErrorConfig<TError = unknown> = ResponseError<TError>

function headerEntries(headers: object): Array<[string, unknown]> {
  if (Array.isArray(headers)) return headers
  return headers instanceof Headers ? [...headers] : Object.entries(headers)
}

function serializeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {}
  const entries = headerEntries(headers)
  const result: Record<string, string> = {}
  for (const [key, value] of entries) {
    if (value === undefined || value === null) continue
    result[key] = typeof value === 'string' ? value : typeof value === 'object' ? JSON.stringify(value) : String(value)
  }
  return result
}

function collectHeadersCaseInsensitive(...sources: Array<unknown>): Record<string, unknown> {
  const keys = new Map<string, string>()
  const result: Record<string, unknown> = {}
  for (const source of sources) {
    if (!source) continue
    const entries = headerEntries(source)
    for (const [key, value] of entries) {
      if (value === undefined || value === null) continue
      const lowerCase = key.toLowerCase()
      const previous = keys.get(lowerCase)
      if (previous !== undefined) delete result[previous]
      keys.set(lowerCase, key)
      result[key] = value
    }
  }
  return result
}

function getHeader(headers: Record<string, string>, name: string): string | undefined {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? headers[key] : undefined
}

function serializeUrl({
  parts,
  pathParams,
  search,
  pathSerializer = defaultPathSerializer,
  pathStyles,
}: {
  parts: Array<string | undefined>
  pathParams: Record<string, unknown>
  search: string
  pathSerializer?: PathSerializer
  pathStyles?: Record<string, PathParamStyle>
}): string {
  const path = parts
    .filter(Boolean)
    .join('')
    .replace(/\{([^{}]+)\}/g, (_, key: string) => pathSerializer({ name: key, value: pathParams[key], options: pathStyles?.[key] }))
  return path + (search ? `?${search}` : '')
}

function createInterceptorChannel<T, TRequest, TResponse>({
  register,
  ejectNative,
  nextSeq,
}: {
  register: (fn: InterceptorFn<T, TRequest, TResponse>) => number
  ejectNative: (id: number) => void
  nextSeq: () => number
}): InterceptorChannel<T, TRequest, TResponse> & {
  detach: () => void
  getEntries: () => Array<{ seq: number; attach: () => void }>
} {
  const handlers = new Map<number, { fn: InterceptorFn<T, TRequest, TResponse>; seq: number; nativeId: number }>()
  let counter = 0

  return {
    use(fn) {
      const id = ++counter
      handlers.set(id, { fn, seq: nextSeq(), nativeId: register(fn) })
      return id
    },
    eject(id) {
      const entry = handlers.get(id)
      if (!entry) return
      ejectNative(entry.nativeId)
      handlers.delete(id)
    },
    update(id, fn) {
      const entry = handlers.get(id)
      if (!entry) return
      ejectNative(entry.nativeId)
      handlers.set(id, { fn, seq: nextSeq(), nativeId: register(fn) })
    },
    detach() {
      for (const entry of handlers.values()) ejectNative(entry.nativeId)
    },
    getEntries() {
      return Array.from(handlers.values(), (entry) => ({
        seq: entry.seq,
        attach() {
          entry.nativeId = register(entry.fn)
        },
      }))
    },
  }
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

    if (scheme.type !== 'apiKey') {
      if (getHeader(headers, 'Authorization') === undefined) {
        headers['Authorization'] = scheme.scheme === 'basic' ? `Basic ${btoa(token)}` : `Bearer ${token}`
      }
      return
    }

    const name = scheme.name ?? 'Authorization'
    if (scheme.in === 'query') {
      if (query[name] === undefined) query[name] = token
      return
    }
    if (scheme.in === 'cookie') {
      headers['Cookie'] = [headers['Cookie'], `${name}=${token}`].filter(Boolean).join('; ')
      return
    }
    if (getHeader(headers, name) === undefined) headers[name] = token
    return
  }
}

async function runValidator<T>({
  validator,
  value,
  context,
  onValidationError,
}: {
  validator: Validator<T> | undefined
  value: T
  context: Omit<ValidationErrorContext, 'value'>
  onValidationError: ValidationErrorHandler | undefined
}): Promise<T> {
  if (!validator) return value
  try {
    return await validateStandardSchema(validator, value)
  } catch (error) {
    if (!onValidationError || !(error instanceof ParseError)) throw error
    const handled = await onValidationError(error, { ...context, value })
    if (!handled) throw error
    return handled.value as T
  }
}

function baseContentType(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  return value.split(';')[0]!.trim().toLowerCase() || undefined
}

function getResponseContentType(headers: Record<string, unknown> | undefined): string | undefined {
  if (!headers) return undefined
  const value = headers['content-type'] ?? headers['Content-Type']
  return baseContentType(typeof value === 'string' ? value : undefined)
}

function resolveSerializers({ config, requestConfig }: { config: { serializer?: Serializers }; requestConfig: { serializer?: Serializers } }) {
  return {
    querySerializer: requestConfig.serializer?.query ?? config.serializer?.query ?? defaultQuerySerializer,
    bodySerializer: requestConfig.serializer?.body ?? config.serializer?.body ?? defaultBodySerializer,
    pathSerializer: requestConfig.serializer?.path ?? config.serializer?.path ?? defaultPathSerializer,
  }
}

async function resolveRequest<TBody, TRequest, TResponse>({
  config,
  requestConfig,
}: {
  config: ClientConfig
  requestConfig: RequestConfig<TBody, TRequest, TResponse>
}): Promise<{ axiosConfig: AxiosRequestConfig; codecs: Record<string, Codec>; throwOnError: boolean }> {
  const { querySerializer, bodySerializer, pathSerializer } = resolveSerializers({ config, requestConfig })
  const codecs = { ...config.codecs, ...requestConfig.codecs }
  const onValidationError = requestConfig.onValidationError ?? config.onValidationError
  const validationContext = { direction: 'request', method: requestConfig.method, url: requestConfig.url } as const

  // Params are encoded before anything reads them: headers before styling, query before auth adds its values.
  const paramValues = {
    path: { ...(requestConfig.path as Record<string, unknown> | undefined) },
    query: { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) },
    headers: collectHeadersCaseInsensitive(config.headers, requestConfig.headers),
  }
  const [validatedPath, validatedQuery, validatedHeaders] = await Promise.all(
    (['path', 'query', 'headers'] as const).map((source) =>
      runValidator({ validator: requestConfig.validator?.[source], value: paramValues[source], context: { ...validationContext, source }, onValidationError }),
    ),
  )

  const headers = serializeHeaders(applyHeaderStyles(validatedHeaders as HeadersInit | undefined, requestConfig.styles?.header))
  const contentType = requestConfig.contentType
  const { request: requestContentTypeOption, response: responseContentType } = typeof contentType === 'string' ? { request: contentType } : (contentType ?? {})
  const requestContentType = requestContentTypeOption ?? getHeader(headers, 'content-type')
  if (responseContentType && getHeader(headers, 'accept') === undefined) {
    headers['Accept'] = responseContentType
  }

  const query: Record<string, unknown> = { ...(validatedQuery as Record<string, unknown> | undefined) }

  await resolveAuth({
    security: requestConfig.security,
    auth: requestConfig.auth ?? config.auth,
    headers,
    query,
  })

  if (requestConfig.cookies) {
    const cookie = serializeCookies(requestConfig.cookies as Record<string, unknown>, requestConfig.styles?.cookie)
    if (cookie) headers['Cookie'] = [headers['Cookie'], cookie].filter(Boolean).join('; ')
  }

  const validatedBody = await runValidator({
    validator: requestConfig.validator?.request,
    value: requestConfig.body,
    context: { ...validationContext, source: 'body' },
    onValidationError,
  })
  const requestContentTypeBase = baseContentType(requestContentType)
  const contentCodec = requestContentTypeBase ? codecs[requestContentTypeBase] : undefined
  const usesDefaultBodySerializer = !contentCodec?.serialize && bodySerializer === defaultBodySerializer
  const body = contentCodec?.serialize
    ? contentCodec.serialize(validatedBody, requestContentType)
    : bodySerializer({ body: validatedBody, contentType: requestContentType, encoding: requestConfig.styles?.body })
  if (requestContentTypeOption) headers['Content-Type'] = requestContentTypeOption
  if (body instanceof URLSearchParams && getHeader(headers, 'content-type') === undefined) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  }
  if (usesDefaultBodySerializer && isDefaultJsonBody(validatedBody) && getHeader(headers, 'content-type') === undefined) {
    headers['Content-Type'] = 'application/json'
  }
  // The transport must set the multipart boundary, even when a content type was explicitly provided.
  if (body instanceof FormData) {
    for (const key of Object.keys(headers)) {
      if (key.toLowerCase() === 'content-type') delete headers[key]
    }
  }

  const pathParams = (validatedPath ?? {}) as Record<string, unknown>
  const url = (requestConfig.url ?? '').replace(/\{([^{}]+)\}/g, (_, key: string) =>
    pathSerializer({ name: key, value: pathParams[key], options: requestConfig.styles?.path?.[key] }),
  )

  const throwOnError = requestConfig.throwOnError ?? config.throwOnError ?? true
  const validateStatus =
    requestConfig.validateStatus ?? config.validateStatus ?? (throwOnError ? (status: number) => status >= 200 && status < 300 : () => true)

  const options = config.options || requestConfig.options ? { ...config.options, ...requestConfig.options } : undefined

  const axiosConfig: AxiosRequestConfig = {
    ...options,
    url,
    baseURL: requestConfig.baseURL ?? config.baseURL,
    method: requestConfig.method ?? 'GET',
    headers,
    params: query,
    paramsSerializer: (params) => querySerializer(params as Record<string, unknown>, requestConfig.styles?.query),
    data: body,
    // Kubb already serialized the body; only URLSearchParams needs a string, since axios's Node adapter rejects it.
    transformRequest: (data) => (data instanceof URLSearchParams ? data.toString() : data),
    signal: requestConfig.signal,
    responseType: requestConfig.responseType,
    validateStatus,
  }

  // Only the fetch adapter exposes a streaming `response.data` (a ReadableStream) in the browser.
  // The default XHR adapter buffers the whole body. Default streams to it, but respect an explicit adapter.
  if (requestConfig.responseType === 'stream' && !axiosConfig.adapter) {
    axiosConfig.adapter = 'fetch'
  }

  return { axiosConfig, codecs, throwOnError }
}

/**
 * Uses the configured axios instance or creates one. `throwOnError` sets axios's default `validateStatus`.
 */
export function createClientCore<TRequest = AxiosRequestConfig, TResponse = AxiosResponse>(
  options: { defaultTransport?: AxiosInstance } & ClientConfig = {},
): ClientInstance<TRequest, TResponse> {
  const { defaultTransport, ...initialConfig } = options
  let config: ClientConfig = initialConfig
  const baseInstance = config.transport ?? defaultTransport ?? axios.create()
  let instance = baseInstance
  const requestContexts = new Map<number, RequestConfig<unknown, TRequest, TResponse>>()
  let requestContextId = 0
  const getContextId = (value: AxiosRequestConfig | AxiosResponse | AxiosError) => {
    if (!value || typeof value !== 'object') return undefined
    const axiosConfig = 'config' in value ? value.config : value
    return (axiosConfig as (AxiosRequestConfig & { __kubbRequestContext?: number }) | undefined)?.__kubbRequestContext
  }
  const setContextId = (value: AxiosRequestConfig | AxiosResponse | AxiosError, id: number | undefined) => {
    if (!value || typeof value !== 'object') return
    const axiosConfig = 'config' in value ? value.config : value
    if (!axiosConfig) return
    const contextualConfig = axiosConfig as AxiosRequestConfig & { __kubbRequestContext?: number }
    if (id === undefined) {
      delete contextualConfig.__kubbRequestContext
      return
    }
    contextualConfig.__kubbRequestContext = id
  }

  const withContext =
    <T extends AxiosRequestConfig | AxiosResponse | AxiosError>(fn: InterceptorFn<T, TRequest, TResponse>) =>
    async (value: T) => {
      const contextId = getContextId(value)
      const requestConfig = contextId === undefined ? undefined : requestContexts.get(contextId)
      const result = await fn(value, requestConfig)
      if (contextId !== undefined) setContextId(result, contextId)
      return result
    }

  let sequenceCounter = 0
  const nextSeq = () => ++sequenceCounter

  // Read at call time so the channels follow a transport swapped in through setConfig.
  const channels = {
    request: createInterceptorChannel<InternalAxiosRequestConfig, TRequest, TResponse>({
      nextSeq,
      register: (fn) => instance.interceptors.request.use(withContext(fn)),
      ejectNative: (id) => instance.interceptors.request.eject(id),
    }),
    response: createInterceptorChannel<AxiosResponse, TRequest, TResponse>({
      nextSeq,
      register: (fn) => instance.interceptors.response.use(withContext(fn)),
      ejectNative: (id) => instance.interceptors.response.eject(id),
    }),
    error: createInterceptorChannel<AxiosError, TRequest, TResponse>({
      nextSeq,
      register: (fn) => {
        const onError = withContext(fn)
        return instance.interceptors.response.use(undefined, async (error: unknown) => {
          const result = await onError(error as AxiosError)
          throw result ?? error
        })
      },
      ejectNative: (id) => instance.interceptors.response.eject(id),
    }),
  }
  const channelList = [channels.request, channels.response, channels.error]
  const interceptors: Interceptors<TRequest, TResponse> = {
    request: { use: channels.request.use, eject: channels.request.eject, update: channels.request.update },
    response: { use: channels.response.use, eject: channels.response.eject, update: channels.response.update },
    error: { use: channels.error.use, eject: channels.error.eject, update: channels.error.update },
  }

  const client = (async <TBody = unknown>(requestConfig: RequestConfig<TBody, TRequest, TResponse>): Promise<CallResult<TRequest, TResponse>> => {
    const activeInstance = requestConfig.transport ?? instance
    const { axiosConfig, codecs, throwOnError } = await resolveRequest({ config, requestConfig })
    const contextId = ++requestContextId
    requestContexts.set(contextId, requestConfig)
    ;(axiosConfig as AxiosRequestConfig & { __kubbRequestContext: number }).__kubbRequestContext = contextId

    try {
      const response = await activeInstance.request<unknown, AxiosResponse>(axiosConfig)
      const validator = requestConfig.validator
      const onValidationError = requestConfig.onValidationError ?? config.onValidationError
      const isSuccess = response.status >= 200 && response.status < 300
      const contentType = getResponseContentType(response.headers as Record<string, unknown>)
      const codec = contentType ? codecs[contentType] : undefined
      const decoded: unknown = contentType && codec?.deserialize ? await codec.deserialize(response.data, contentType) : response.data
      const data = await runValidator({
        validator: isSuccess ? validator?.response : validator?.error,
        value: decoded,
        context: {
          direction: isSuccess ? 'response' : 'error',
          source: 'body',
          method: response.config?.method?.toUpperCase(),
          url: response.config?.url,
          status: response.status,
        },
        onValidationError,
      })
      const result = {
        status: response.status,
        data: isSuccess ? data : undefined,
        error: isSuccess ? undefined : data,
        contentType,
        request: response.config as TRequest,
        response: response as TResponse,
      }
      setContextId(response, undefined)
      return result
    } catch (error) {
      const axiosError = error as AxiosError
      setContextId(axiosError, undefined)
      if (axiosError.response) setContextId(axiosError.response, undefined)
      if (throwOnError && axiosError.response) {
        throw new ResponseError({
          data: axiosError.response.data,
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
          contentType: getResponseContentType(axiosError.response.headers as Record<string, unknown>),
          request: axiosError.config as TRequest,
          response: axiosError.response as TResponse,
          method: axiosError.config?.method?.toUpperCase(),
          url: [axiosError.config?.baseURL?.replace(/\/+$/, ''), axiosError.config?.url].filter(Boolean).join(''),
        })
      }
      throw error
    } finally {
      setContextId(axiosConfig, undefined)
      requestContexts.delete(contextId)
    }
  }) as ClientInstance<TRequest, TResponse>

  client.getConfig = () => config
  client.setConfig = (next) => {
    config = { ...config, ...next, headers: { ...serializeHeaders(config.headers), ...serializeHeaders(next.headers) } }
    const nextInstance = config.transport ?? baseInstance
    if (nextInstance !== instance) {
      for (const channel of channelList) channel.detach()
      instance = nextInstance
      const entries = channelList.flatMap((channel) => channel.getEntries()).sort((a, b) => a.seq - b.seq)
      for (const entry of entries) entry.attach()
    }
    return config
  }
  client.getUrl = (requestConfig) => {
    const { querySerializer, pathSerializer } = resolveSerializers({ config, requestConfig })
    const query: Record<string, unknown> = { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) }
    return serializeUrl({
      parts: [requestConfig.baseURL ?? config.baseURL, requestConfig.url],
      pathParams: (requestConfig.path ?? {}) as Record<string, unknown>,
      search: querySerializer(query, requestConfig.styles?.query),
      pathSerializer,
      pathStyles: requestConfig.styles?.path,
    })
  }
  client.interceptors = interceptors
  client.createClient = (next) => createClientCore<TRequest, TResponse>({ ...config, ...next })

  return client
}

/**
 * The axios instance the generated `client` sends through. Register axios interceptors on it or reuse it inside your own transport.
 */
export const defaultTransport = axios.create()

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
    switch (field) {
      case 'data':
        data.push(value)
        break
      case 'event':
        event.event = value
        break
      case 'id':
        event.id = value
        break
      case 'retry':
        if (Number.isFinite(Number(value))) event.retry = Number(value)
        break
    }
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
 * Returns parsed events alongside the native response.
 */
export type EventStreamResult<TData = unknown, TResponse = AxiosResponse> = {
  stream: AsyncGenerator<ServerSentEvent<TData>>
  response: TResponse
}

/**
 * Exposes a streaming response body as typed Server-Sent Events.
 */
export async function toEventStream<TData = unknown>(result: Promise<{ data: unknown; response: AxiosResponse }>): Promise<EventStreamResult<TData>> {
  const { data, response } = await result
  return {
    response,
    stream: parseEventStream<TData>(data as ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>),
  }
}

export const client = createClientCore({ defaultTransport })

export const createClient = (config?: Parameters<typeof client.createClient>[0]) => client.createClient(config)
