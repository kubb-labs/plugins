import { applyHeaderStyles, defaultBodySerializer, defaultPathSerializer, defaultQuerySerializer, serializeCookies } from './serializers'
import type { HeadersInit, PathParamStyle, PathSerializer, RequestSerialization, Serializers } from './serializers'

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
export type RequestResult<TResponses, ThrowOnError extends boolean = true, TRequest = Request, TResponse = Response> = ThrowOnError extends true
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
export type DataShape = { body?: unknown; cookies?: unknown; headers?: unknown; path?: unknown; query?: unknown }

export type RequestCredentials = 'omit' | 'same-origin' | 'include'
export type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'

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
 * from the grouped options; everything else is plain request configuration.
 */
export type RequestConfig<TBody = unknown, TRequest = Request, TResponse = Response> = {
  baseURL?: string
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  path?: Record<string, unknown>
  query?: unknown
  params?: unknown
  cookies?: Record<string, unknown>
  body?: TBody
  headers?: HeadersInit
  serialization?: RequestSerialization
  signal?: AbortSignal
  credentials?: RequestCredentials
  contentType?: string
  responseType?: ResponseType
  throwOnError?: boolean
  client?: ClientInstance<TRequest, TResponse>
  transport?: Transport<TRequest, TResponse>
  serializer?: Serializers
  parser?: { request?: Parser; response?: Parser; error?: Parser }
  security?: Array<Auth>
  auth?: AuthResolver
}

/**
 * The grouped options object passed to every generated function: the request config minus the
 * data-shaped keys and the literal `url`, plus the per-operation `<Name>Request`.
 */
export type Options<TData extends DataShape, ThrowOnError extends boolean = true, TRequest = Request, TResponse = Response> = Omit<
  RequestConfig<unknown, TRequest, TResponse>,
  keyof DataShape | 'url'
> &
  TData & {
    client?: ClientInstance<TRequest, TResponse>
    throwOnError?: ThrowOnError
  }

/**
 * Client-level configuration shared by every call an instance makes. Per-call `RequestConfig`
 * overrides these.
 */
export type ClientConfig<TRequest = Request, TResponse = Response> = {
  baseURL?: string
  headers?: HeadersInit
  credentials?: RequestCredentials
  throwOnError?: boolean
  transport?: Transport<TRequest, TResponse>
  serializer?: Serializers
  auth?: AuthResolver
}

/**
 * The normalized request the transport receives. The shared core does all serialization, auth, and
 * header work; the transport only performs the send.
 */
export type ResolvedRequest = {
  url: string
  method: string
  headers: Record<string, string>
  body?: BodyInit
  signal?: AbortSignal
  credentials?: RequestCredentials
  responseType?: ResponseType
}

/**
 * What a transport returns: the parsed body plus the native request/response objects, kept reachable
 * so status, headers, and the raw body never have to grow the result type.
 */
export type TransportResult<TData = unknown, TRequest = Request, TResponse = Response> = {
  data: TData
  status: number
  statusText: string
  headers: Headers
  request: TRequest
  response: TResponse
}

/**
 * The per-plugin send. plugin-fetch wraps `globalThis.fetch`, plugin-axios an axios instance, and
 * plugin-ky a ky instance. Supplied to `createClientCore` as `defaultTransport`.
 */
export type Transport<TRequest = Request, TResponse = Response> = (request: ResolvedRequest) => Promise<TransportResult<unknown, TRequest, TResponse>>

/**
 * The result a resolved call produces before it is cast to `RequestResult` by the generated wrapper.
 */
export type CallResult<TRequest = Request, TResponse = Response> = {
  status: number
  data: unknown
  error: unknown
  request: TRequest
  response: TResponse
}

/**
 * A registered interceptor with its ejection id.
 */
export type InterceptorFn<T> = (value: T) => T | Promise<T>

/**
 * A single interceptor channel — request, response, or error — with a transport-agnostic
 * `use` / `eject` / `update` API.
 */
export type InterceptorStack<T> = {
  use: (fn: InterceptorFn<T>) => number
  eject: (id: number) => void
  update: (id: number, fn: InterceptorFn<T>) => void
  run: (value: T) => Promise<T>
}

/**
 * The three interceptor channels every client instance exposes.
 */
export type Interceptors<TRequest = Request, TResponse = Response> = {
  request: InterceptorStack<ResolvedRequest>
  response: InterceptorStack<TransportResult<unknown, TRequest, TResponse>>
  error: InterceptorStack<ResponseError<unknown, TRequest, TResponse>>
}

/**
 * A client instance: the callable send plus configuration, interceptors, and an isolated
 * `createClient` factory bound to the same transport.
 */
export type ClientInstance<TRequest = Request, TResponse = Response> = {
  <TBody = unknown>(config: RequestConfig<TBody, TRequest, TResponse>): Promise<CallResult<TRequest, TResponse>>
  getConfig: () => ClientConfig<TRequest, TResponse>
  setConfig: (config: ClientConfig<TRequest, TResponse>) => ClientConfig<TRequest, TResponse>
  getUrl: <TBody = unknown>(config: RequestConfig<TBody, TRequest, TResponse>) => string
  interceptors: Interceptors<TRequest, TResponse>
  createClient: (config?: ClientConfig<TRequest, TResponse>) => ClientInstance<TRequest, TResponse>
}

/**
 * Thrown for responses outside the 2xx range, so a resolved call always means success. The parsed
 * error body and the native request/response stay reachable on the error.
 */
export class ResponseError<TError = unknown, TRequest = Request, TResponse = Response> extends Error {
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
 * (URL-encoded), and appends the serialized query. Shared by the send path and `getUrl` so both
 * produce an identical URL.
 */
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

/**
 * Creates a transport-agnostic interceptor channel. Interceptors run in registration order; `eject`
 * removes one by id and `update` swaps its function in place without reordering.
 */
export function createInterceptorStack<T>(): InterceptorStack<T> {
  let entries: Array<{ id: number; fn: InterceptorFn<T> }> = []
  let counter = 0
  return {
    use(fn) {
      const id = ++counter
      entries.push({ id, fn })
      return id
    },
    eject(id) {
      entries = entries.filter((entry) => entry.id !== id)
    },
    update(id, fn) {
      const entry = entries.find((item) => item.id === id)
      if (entry) entry.fn = fn
    },
    async run(value) {
      let result = value
      for (const entry of entries) {
        result = await entry.fn(result)
      }
      return result
    },
  }
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
 * Builds the shared client core bound to a transport. Each plugin calls this with its
 * `defaultTransport` and exports the resulting instance as `client`, plus a `createClient` factory.
 */
export function createClientCore<TRequest = Request, TResponse = Response>(
  options: { defaultTransport: Transport<TRequest, TResponse> } & ClientConfig<TRequest, TResponse>,
): ClientInstance<TRequest, TResponse> {
  const { defaultTransport, ...initialConfig } = options
  let config: ClientConfig<TRequest, TResponse> = { ...initialConfig }

  const interceptors: Interceptors<TRequest, TResponse> = {
    request: createInterceptorStack<ResolvedRequest>(),
    response: createInterceptorStack<TransportResult<unknown, TRequest, TResponse>>(),
    error: createInterceptorStack<ResponseError<unknown, TRequest, TResponse>>(),
  }

  const client = (async <TBody = unknown>(requestConfig: RequestConfig<TBody, TRequest, TResponse>): Promise<CallResult<TRequest, TResponse>> => {
    const transport = requestConfig.transport ?? config.transport ?? defaultTransport
    const querySerializer = requestConfig.serializer?.query ?? config.serializer?.query ?? defaultQuerySerializer
    const bodySerializer = requestConfig.serializer?.body ?? config.serializer?.body ?? defaultBodySerializer
    const pathSerializer = requestConfig.serializer?.path ?? config.serializer?.path ?? defaultPathSerializer

    const headers = mergeHeaders(config.headers, applyHeaderStyles(requestConfig.headers, requestConfig.serialization?.header))
    const requestContentType = requestConfig.contentType ?? headers['Content-Type'] ?? headers['content-type']

    const query: Record<string, unknown> = { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) }

    await resolveAuth({
      security: requestConfig.security,
      auth: requestConfig.auth ?? config.auth,
      headers,
      query,
    })

    if (requestConfig.cookies) {
      const cookie = serializeCookies(requestConfig.cookies, requestConfig.serialization?.cookie)
      if (cookie) headers.Cookie = [headers.Cookie, cookie].filter(Boolean).join('; ')
    }

    const rawBody = requestConfig.body
    const validatedBody = await runParser(requestConfig.parser?.request, rawBody)
    const body = bodySerializer({ body: validatedBody, contentType: requestContentType, encoding: requestConfig.serialization?.body })
    // A FormData body must keep its Content-Type unset so the runtime appends the multipart boundary.
    if (body instanceof FormData) {
      delete headers['Content-Type']
      delete headers['content-type']
    } else if (requestConfig.contentType) {
      headers['Content-Type'] = requestConfig.contentType
    }
    const url = serializeUrl({
      parts: [config.baseURL, requestConfig.baseURL, requestConfig.url],
      pathParams: requestConfig.path ?? {},
      search: querySerializer(query, requestConfig.serialization?.query),
      pathSerializer,
      pathStyles: requestConfig.serialization?.path,
    })

    let resolvedRequest: ResolvedRequest = {
      url,
      method: (requestConfig.method ?? 'GET').toUpperCase(),
      headers,
      body,
      signal: requestConfig.signal,
      credentials: requestConfig.credentials,
      responseType: requestConfig.responseType,
    }
    resolvedRequest = await interceptors.request.run(resolvedRequest)

    let result = await transport(resolvedRequest)
    result = await interceptors.response.run(result)

    const isSuccess = result.status >= 200 && result.status < 300
    const throwOnError = requestConfig.throwOnError ?? config.throwOnError ?? true

    if (!isSuccess && throwOnError) {
      const error = new ResponseError({
        data: result.data,
        status: result.status,
        statusText: result.statusText,
        request: result.request,
        response: result.response,
      })
      await interceptors.error.run(error)
      throw error
    }

    const data = isSuccess ? await runParser(requestConfig.parser?.response, result.data) : undefined
    const error = isSuccess ? undefined : await runParser(requestConfig.parser?.error, result.data)

    return {
      status: result.status,
      data,
      error,
      request: result.request,
      response: result.response,
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
    return serializeUrl({
      parts: [config.baseURL, requestConfig.baseURL, requestConfig.url],
      pathParams: requestConfig.path ?? {},
      search: querySerializer(query, requestConfig.serialization?.query),
      pathSerializer,
      pathStyles: requestConfig.serialization?.path,
    })
  }
  client.interceptors = interceptors
  client.createClient = (next) => createClientCore({ defaultTransport, ...config, ...next })

  return client
}

/**
 * Picks a `responseType` from a `Content-Type` header, or `undefined` when it is not recognized.
 */
function detectResponseType(contentType: string | null): ResponseType | undefined {
  if (!contentType) return undefined
  if (contentType.includes('application/json') || contentType.includes('text/json')) return 'json'
  if (contentType.includes('text/')) return 'text'
  if (contentType.includes('image/') || contentType.includes('application/octet-stream')) return 'blob'
  return undefined
}

/**
 * Parses a `fetch` response body. Empty responses (204/205/304 or no body) resolve to `undefined`.
 * An explicit `responseType`, or one detected from the `Content-Type` header, forces the matching
 * `Response` method; otherwise the body is read as text and `JSON.parse`d, falling back to raw text.
 */
async function parseResponse(response: Response, responseType?: ResponseType): Promise<unknown> {
  if (response.status === 204 || response.status === 205 || response.status === 304 || !response.body) {
    return undefined
  }

  switch (responseType ?? detectResponseType(response.headers.get('Content-Type'))) {
    case 'text':
    case 'document':
      return response.text()
    case 'blob':
      return response.blob()
    case 'arraybuffer':
      return response.arrayBuffer()
    case 'stream':
      return response.body ?? undefined
    case 'json': {
      // An empty body with a JSON content-type would make response.json() throw; treat it as no data.
      const body = await response.text()
      return body ? JSON.parse(body) : undefined
    }
  }

  const text = await response.text()
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * The default transport: builds a native `Request` from the resolved request, sends it through
 * `globalThis.fetch`, and returns the parsed body alongside the native request/response objects.
 */
const defaultTransport: Transport = async (request: ResolvedRequest): Promise<TransportResult> => {
  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
  }
  if (request.credentials) init.credentials = request.credentials

  const nativeRequest = new Request(request.url, init)
  const response = await globalThis.fetch(nativeRequest)
  const data = await parseResponse(response, request.responseType)

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    request: nativeRequest,
    response,
  }
}

export const client = createClientCore({ defaultTransport })

export const createClient = (config?: Parameters<typeof client.createClient>[0]) => client.createClient(config)