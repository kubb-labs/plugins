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
 * The single shape every generated function returns. With `throwOnError` (the default) a resolved
 * call always means success, so `data` is defined and `error` is `undefined`. Without it the result
 * is discriminated by `error`, so narrowing on `error` narrows `data`.
 */
export type RequestResult<TResponses, ThrowOnError extends boolean = true, TRequest = Request, TResponse = Response> = ThrowOnError extends true
  ? { data: SuccessOf<TResponses>; error: undefined; request: TRequest; response: TResponse }
  : ({ data: SuccessOf<TResponses>; error: undefined } | { data: undefined; error: ErrorOf<TResponses> }) & { request: TRequest; response: TResponse }

/**
 * The data-shaped keys of the grouped options object. `Options` subtracts these from the runtime
 * `RequestConfig` and adds them back, typed per operation, from the generated `<Name>Request` type.
 */
export type DataShape = { body?: unknown; headers?: unknown; path?: unknown; query?: unknown }

export type HeaderValue = string | number | boolean | null | undefined | object
export type HeadersInit = Array<[string, HeaderValue]> | Record<string, HeaderValue>
export type RequestCredentials = 'omit' | 'same-origin' | 'include'
export type ResponseType = 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'

/**
 * Serializes the query object into a search string. Array and object members follow the configured
 * style (`form` with `explode` by default; `deepObject` for nested objects).
 */
export type QuerySerializer = (params: Record<string, unknown>) => string

/**
 * Serializes the request body. JSON by default; `FormData`, `URLSearchParams`, `Blob`,
 * `ArrayBuffer`, and string bodies pass through untouched.
 */
export type BodySerializer = (body: unknown, contentType?: string) => BodyInit | undefined

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
 * from the grouped options; everything else is plain request configuration.
 */
export type RequestConfig<TBody = unknown, TRequest = Request, TResponse = Response> = {
  baseURL?: string
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  path?: Record<string, unknown>
  query?: unknown
  params?: unknown
  body?: TBody
  headers?: HeadersInit
  signal?: AbortSignal
  credentials?: RequestCredentials
  contentType?: string
  responseType?: ResponseType
  throwOnError?: boolean
  client?: ClientInstance<TRequest, TResponse>
  transport?: Transport<TRequest, TResponse>
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
  querySerializer?: QuerySerializer
  bodySerializer?: BodySerializer
  schemes?: Record<string, SecurityScheme>
  auth?: AuthCallback
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

function isFormBody(body: unknown): body is BodyInit {
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
  if (isFormBody(body)) return body as BodyInit
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
    const querySerializer = requestConfig.querySerializer ?? config.querySerializer ?? defaultQuerySerializer
    const bodySerializer = requestConfig.bodySerializer ?? config.bodySerializer ?? defaultBodySerializer

    const headers = mergeHeaders(config.headers, requestConfig.headers)
    if (requestConfig.contentType && requestConfig.contentType !== 'multipart/form-data') {
      headers['Content-Type'] = requestConfig.contentType
    }

    const query: Record<string, unknown> = { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) }

    await resolveAuth({
      security: requestConfig.security,
      schemes: requestConfig.schemes ?? config.schemes,
      auth: requestConfig.auth ?? config.auth,
      headers,
      query,
    })

    const rawBody = requestConfig.body
    const validatedBody = await runParser(requestConfig.parser?.request, rawBody)
    const search = querySerializer(query)
    const pathParams = requestConfig.path ?? {}
    const interpolatedUrl = [config.baseURL, requestConfig.baseURL, requestConfig.url]
      .filter(Boolean)
      .join('')
      .replace(/\{([^{}]+)\}/g, (_, key: string) => encodeURIComponent(String(pathParams[key] ?? '')))
    const url = interpolatedUrl + (search ? `?${search}` : '')

    let resolvedRequest: ResolvedRequest = {
      url,
      method: (requestConfig.method ?? 'GET').toUpperCase(),
      headers,
      body: bodySerializer(validatedBody, headers['Content-Type'] ?? headers['content-type']),
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

    return {
      data,
      error: isSuccess ? undefined : result.data,
      request: result.request,
      response: result.response,
    }
  }) as ClientInstance<TRequest, TResponse>

  client.getConfig = () => config
  client.setConfig = (next) => {
    config = { ...config, ...next, headers: { ...serializeHeaders(config.headers), ...serializeHeaders(next.headers) } }
    return config
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
