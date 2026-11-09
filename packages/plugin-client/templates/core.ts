import type { NativeOptions, NativeRequest, NativeResponse } from './client.ts'
import { defaultMediaTypes, isEncodedBody, resolveMediaType } from './mediaTypes.ts'
import type { MediaTypeContext, MediaTypes } from './mediaTypes.ts'
import { applyHeaderStyles, baseContentType, defaultPathSerializer, defaultQuerySerializer, serializeCookies } from './serializers.ts'
import type { HeadersInit, HttpMethod, PathParamStyle, PathSerializer, RequestBody, Serializers, Styles } from './serializers.ts'
import { isValidationEnabled, runValidator, type StandardSchemaValidator } from './standardSchema.ts'
import type { ValidateOption, ValidationErrorHandler } from './standardSchema.ts'

export * from './mediaTypes.ts'

/**
 * HTTP status codes treated as a success, everything else is an error. `2XX` covers every 2xx status.
 */
export type SuccessStatusCode = '200' | '201' | '202' | '203' | '204' | '205' | '206' | '207' | '208' | '226' | '2XX'

export type SuccessOf<TResponses> = TResponses[Extract<keyof TResponses, SuccessStatusCode>]

export type ErrorOf<TResponses> = TResponses[Exclude<keyof TResponses, SuccessStatusCode>]

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

type ToNumber<T> = T extends `${infer TNumber extends number}` ? TNumber : never

/**
 * Converts a response record's status key to its numeric literal. A range key such as `4XX` becomes the statuses it
 * covers, minus the ones `TKeys` declares on their own, and `default` becomes `number`.
 */
export type ToStatusNumber<TStatus, TKeys = never> = TStatus extends `${infer TNumber extends number}`
  ? TNumber
  : Uppercase<TStatus & string> extends `${infer TFirst extends '1' | '2' | '3' | '4' | '5'}XX`
    ? Exclude<ToNumber<`${TFirst}${Digit}${Digit}`>, ToNumber<TKeys>>
    : number

/**
 * The `error` of a failed call whose response has no body, so `if (error)` still sees the failure.
 */
export type EmptyErrorBody = { status: number; statusText: string }

/**
 * Unwraps content-type variants to keep the bare body on `error`.
 */
export type DataOf<T> = T extends { contentType: string; data: infer TData } ? TData : T

/**
 * Keeps `contentType` beside `data` so switching on it narrows the body. A `text/event-stream` body next to other
 * content types is the raw stream: pass it to `parseEventStream`, or call the operation with `apiClient.stream`.
 */
export type SuccessVariant<TStatus, TEntry, TRequest, TResponse, TKeys = never> = TEntry extends { contentType: string; data: unknown }
  ? TEntry extends { contentType: infer TContentType; data: infer TData }
    ? {
        status: ToStatusNumber<TStatus, TKeys>
        data: TContentType extends `text/event-stream${string}` ? ReadableStream<Uint8Array> : TData
        error: undefined
        contentType: TContentType
        request: TRequest
        response: TResponse
      }
    : never
  : { status: ToStatusNumber<TStatus, TKeys>; data: TEntry; error: undefined; contentType: string | undefined; request: TRequest; response: TResponse }

/**
 * Narrows `data` or `error` when switching on the numeric status.
 */
export type ResultByStatus<TResponses, TStatus extends keyof TResponses, TRequest, TResponse> = TStatus extends SuccessStatusCode
  ? SuccessVariant<TStatus, TResponses[TStatus], TRequest, TResponse, keyof TResponses>
  : {
      status: ToStatusNumber<TStatus, keyof TResponses>
      data: undefined
      error: DataOf<TResponses[TStatus]> | EmptyErrorBody
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
export type RequestResult<TResponses, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = ThrowOnError extends true
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
 * A result narrowed to its `data` when `ThrowOnError` is true, and kept whole when it is false.
 */
export type Unwrapped<T, ThrowOnError extends boolean> = ThrowOnError extends true ? (T extends { data: infer TData } ? TData : never) : T

/**
 * The shape a generated operation returns with `returnType: 'data'`: the success body when
 * `throwOnError` is true, or the full `RequestResult` when it is false.
 */
export type UnwrappedResult<TResponses, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = Unwrapped<
  RequestResult<TResponses, ThrowOnError, TRequest, TResponse>,
  ThrowOnError
>

/**
 * Returns the success body when `throwOnError` is true, or the full result when it is false.
 */
export function unwrapResult<T extends { data: unknown; error: unknown }, ThrowOnError extends boolean>(
  promise: Promise<T>,
  throwOnError: ThrowOnError,
): Promise<Unwrapped<T, ThrowOnError>> {
  return promise.then((result) => (throwOnError ? result.data : result) as Unwrapped<T, ThrowOnError>)
}

/**
 * The call's `throwOnError`, or the generated default when the call leaves it unset. The default matches the
 * operation's `ThrowOnError` type parameter, which is why the result can be typed as it.
 */
export function resolveThrowOnError<ThrowOnError extends boolean>(throwOnError: ThrowOnError | undefined, fallback: boolean): ThrowOnError {
  return (throwOnError ?? fallback) as ThrowOnError
}

export type DataShape = { body?: unknown; cookies?: unknown; headers?: unknown; path?: unknown; query?: unknown }

export type RequestCredentials = 'omit' | 'same-origin' | 'include'

/**
 * Reads a 2xx body without looking up its media type: `json`, `text`, `blob`, `arrayBuffer`, or `stream` for the raw
 * `ReadableStream`. An error body is still decoded by its media type.
 */
export type ParseAs = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'

/**
 * A string sets the request content type. The object form can also set `Accept`, which is also the media type a
 * 2xx response without a `Content-Type` is decoded as.
 */
export type ContentType = string | { request?: string; response?: string }

/**
 * Validates request bodies and params, success bodies, or error bodies with Standard Schema.
 */
export type Validator<T = unknown> = StandardSchemaValidator<T>

export type { ValidateOption, ValidationErrorContext, ValidationErrorHandler } from './standardSchema.ts'

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
 * One entry of a call's `security`: a scheme, or the schemes one requirement needs together.
 */
export type SecurityRequirement = Auth | Array<Auth>

/**
 * Return `user:password` for basic auth, or `undefined` to skip a scheme.
 */
export type AuthToken = string | undefined

/**
 * Resolves the token for a security scheme: a static token, or a callback, sync or async, called per scheme. A requirement
 * is sent when every scheme it needs has a token; the first such requirement wins.
 */
export type AuthResolver = AuthToken | ((auth: Auth) => AuthToken | Promise<AuthToken>)

/**
 * One decoded Server-Sent Event. `data` is parsed as JSON when valid and kept as the raw string otherwise,
 * `event` is `message` when the server sent no `event` field, and `id` is the last event ID the stream has set.
 */
export type ServerSentEvent<TData = unknown> = {
  data: TData
  event: string
  id?: string
  retry?: number
}

/** An event the document types by name: the member's own `event` and `data`, plus the `id` and `retry` any event may carry. */
export type TypedEvent<TEvent> = TEvent & Pick<ServerSentEvent, 'id' | 'retry'>

/** Per-call options of a streamed operation, read by the stream media types. */
export type EventStreamOptions = {
  /**
   * The largest number of characters, line breaks included, one event may hold before the blank line that ends it, or one
   * line of JSON Lines may hold.
   * A larger event throws a `RangeError` and cancels the stream. Set `Infinity` to turn the limit off.
   * @default 16777216
   */
  maxEventSize?: number
  /**
   * Ends the stream when an event's raw `data`, or a JSON Lines line, equals this value, such as `[DONE]`.
   */
  terminator?: string
  /**
   * Maps each Server-Sent Event before validation. JSON Lines items are not passed through it.
   */
  transform?: (event: ServerSentEvent) => ServerSentEvent
  /**
   * What `validator.response` checks on each Server-Sent Event: `data` validates the payload, `event` the whole event.
   * Unset, each item is validated as a whole, as a JSON Lines line is.
   */
  eventShape?: 'event' | 'data'
}

export type RequestConfig<TBody = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = {
  baseURL?: string
  url?: string
  method?: HttpMethod
  path?: unknown
  query?: unknown
  /** Alias of `query`, kept for callers that pass the query under this name. */
  params?: unknown
  cookies?: unknown
  body?: TBody
  headers?: unknown
  styles?: Styles
  signal?: AbortSignal
  credentials?: RequestCredentials
  options?: NativeOptions
  contentType?: ContentType
  parseAs?: ParseAs
  throwOnError?: boolean
  client?: ClientInstance<TRequest, TResponse>
  transport?: Transport<TRequest, TResponse>
  serializer?: Serializers
  /** Merged per key over the client's media types. */
  mediaTypes?: MediaTypes
  /** `error` takes one validator for every non-2xx body, or a map by status such as `{ 404: schema, '5XX': schema, default: schema }`. */
  validator?: {
    request?: Validator
    path?: Validator
    query?: Validator
    headers?: Validator
    cookies?: Validator
    response?: Validator
    error?: Validator | Record<string, Validator>
  }
  onValidationError?: ValidationErrorHandler
  validate?: ValidateOption
  security?: Array<SecurityRequirement>
  auth?: AuthResolver
}

/**
 * Combines client options with the operation's typed request params and body.
 */
export type Options<TData extends DataShape, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = Omit<
  RequestConfig<unknown, TRequest, TResponse>,
  keyof DataShape | 'url'
> &
  TData & {
    client?: ClientInstance<TRequest, TResponse>
    throwOnError?: ThrowOnError
  }

/** The options of a streamed operation: the call's `Options` with the per-call stream options. */
export type StreamOptions<TData extends DataShape, ThrowOnError extends boolean = true> = Options<TData, ThrowOnError> & EventStreamOptions

/**
 * Client-level configuration shared by every call an instance makes, overridden by the per-call `RequestConfig`.
 */
export type ClientConfig<TRequest = NativeRequest, TResponse = NativeResponse> = {
  baseURL?: string
  headers?: HeadersInit
  credentials?: RequestCredentials
  options?: NativeOptions
  throwOnError?: boolean
  transport?: Transport<TRequest, TResponse>
  serializer?: Serializers
  /** Merged per key over the built-in `defaultMediaTypes`, and by `setConfig` over the ones set before. */
  mediaTypes?: MediaTypes
  onValidationError?: ValidationErrorHandler
  validate?: ValidateOption
  auth?: AuthResolver
}

/**
 * The normalized request the transport receives, with all serialization, auth, and header work already done.
 */
export type ResolvedRequest = {
  url: string
  method: string
  headers: Record<string, string>
  body?: RequestBody
  signal?: AbortSignal
  credentials?: RequestCredentials
  options?: NativeOptions
  /** The response is read as a stream, so a transport that buffers bodies by default, such as axios, must stream it. */
  stream?: boolean
}

/**
 * What a transport may return instead of a bare `Response`: the web `Response` plus the native request and response
 * objects the results and errors carry, such as axios's config and response.
 */
export type TransportResult<TRequest = NativeRequest, TResponse = NativeResponse> = {
  webResponse: Response
  request: TRequest
  response: TResponse
}

/**
 * The per-plugin send, supplied to `createClientCore` as `defaultTransport`. It returns a web `Response`, or a
 * `TransportResult` that carries one, and the core decodes the body by its media type.
 */
export type Transport<TRequest = NativeRequest, TResponse = NativeResponse> = (
  request: ResolvedRequest,
) => Promise<Response | TransportResult<TRequest, TResponse>>

/**
 * What response interceptors receive: the decoded body with the status, headers, and the native request and response.
 */
export type DecodedResponse<TData = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = {
  data: TData
  status: number
  statusText: string
  headers: Headers
  contentType?: string
  request: TRequest
  response: TResponse
}

export type InterceptorFn<T, TContext = never, TResult = T> = (value: T, context?: TContext) => TResult | Promise<TResult>

/**
 * A single interceptor channel with a transport-agnostic `use` / `eject` / `update` API.
 */
export type InterceptorStack<T, TContext = never, TResult = T> = {
  use: (fn: InterceptorFn<T, TContext, TResult>) => number
  eject: (id: number) => void
  update: (id: number, fn: InterceptorFn<T, TContext, TResult>) => void
  run: (value: T, context?: TContext) => Promise<T>
}

export type Interceptors<TRequest = NativeRequest, TResponse = NativeResponse> = {
  request: InterceptorStack<ResolvedRequest, RequestConfig<unknown, TRequest, TResponse>>
  response: InterceptorStack<DecodedResponse<unknown, TRequest, TResponse>, RequestConfig<unknown, TRequest, TResponse>>
  /**
   * Sees every failure of a call: a `ResponseError`, a network error, an abort, or a validation error. A handler returns
   * the error, another error that the call throws instead, or nothing to keep the error.
   */
  error: InterceptorStack<ResponseError<unknown, TRequest, TResponse> | Error, RequestConfig<unknown, TRequest, TResponse>, Error | void>
}

export type UrlConfig = Pick<RequestConfig, 'baseURL' | 'url' | 'path' | 'query' | 'params' | 'serializer' | 'styles'>

type StreamParts<TEvent> = AsyncIterable<TEvent> & {
  stream: AsyncGenerator<TEvent>
  /**
   * The last event ID the server sent, to resume from with a `Last-Event-ID` header on a new call. Empty until the server sends `id`.
   */
  readonly lastEventId: string
}

type WithEvents<TResult, TEvent> = TResult extends { error: undefined } ? Omit<TResult, 'data'> & { data: AsyncGenerator<TEvent> } : TResult

/**
 * A stream call's result, as `RequestResult` is a regular call's: `status` narrows `error`, and the items are its
 * `data`. Iterating the result reads `stream`, which yields nothing for a failed call.
 */
export type StreamResult<
  TResponses,
  ThrowOnError extends boolean = true,
  TEvent = ServerSentEvent<SuccessOf<TResponses>>,
  TRequest = NativeRequest,
  TResponse = NativeResponse,
> = WithEvents<RequestResult<TResponses, ThrowOnError, TRequest, TResponse>, TEvent> & StreamParts<TEvent>

/**
 * What a stream operation returns with `returnType: 'data'`, as `UnwrappedResult` is for a regular call.
 */
export type UnwrappedStreamResult<TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>> = Unwrapped<
  StreamResult<TResponses, ThrowOnError, TEvent>,
  ThrowOnError
>

/**
 * Parsed events with the fields a `RequestResult` carries, untyped by status. `TEvent` is the event type, such as
 * `ServerSentEvent<Pet>` or `TypedEvent<ChatEvent>`.
 */
export type EventStreamResult<TEvent = ServerSentEvent, TResponse = NativeResponse> = StreamParts<TEvent> & {
  data: AsyncGenerator<TEvent> | undefined
  status: number | undefined
  error: unknown
  contentType: string | undefined
  request: NativeRequest | undefined
  response: TResponse
}

/**
 * A client instance: the callable send, `stream` for an operation that streams items, configuration, interceptors, and
 * the `createClient` and `extend` factories bound to the same transport.
 */
export type ClientInstance<TRequest = NativeRequest, TResponse = NativeResponse> = {
  <TResponses = unknown, ThrowOnError extends boolean = true>(
    config: RequestConfig<unknown, TRequest, TResponse> & { throwOnError?: ThrowOnError },
  ): Promise<RequestResult<TResponses, ThrowOnError, TRequest, TResponse>>
  /**
   * Runs the same pipeline and reads a 2xx body item by item with its media type's `stream`, validating each item. A 2xx
   * answer whose media type cannot stream throws a `TypeError` with the decoded body as its `cause`.
   */
  stream: <TResponses = unknown, ThrowOnError extends boolean = true, TItem = ServerSentEvent<SuccessOf<TResponses>>>(
    config: RequestConfig<unknown, TRequest, TResponse> & EventStreamOptions & { throwOnError?: ThrowOnError },
  ) => Promise<StreamResult<TResponses, ThrowOnError, TItem, TRequest, TResponse>>
  getConfig: () => ClientConfig<TRequest, TResponse>
  setConfig: (config: ClientConfig<TRequest, TResponse>) => ClientConfig<TRequest, TResponse>
  getUrl: (config: UrlConfig) => string
  interceptors: Interceptors<TRequest, TResponse>
  /** A client with this client's config and its own, empty interceptors. */
  createClient: (config?: ClientConfig<TRequest, TResponse>) => ClientInstance<TRequest, TResponse>
  /** A client with this client's config, whose calls run this client's interceptors before its own. */
  extend: (config?: ClientConfig<TRequest, TResponse>) => ClientInstance<TRequest, TResponse>
}

/**
 * Thrown for a non-2xx response, so a resolved call always means success.
 */
export class ResponseError<TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse> extends Error {
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

type ErrorStatus<TResponses> = Exclude<keyof TResponses, SuccessStatusCode>

/**
 * The `ResponseError` an operation throws, as a union by status: checking `status` narrows `data` to that status's body.
 */
export type ResponseErrorOf<TResponses, TRequest = NativeRequest, TResponse = NativeResponse> = [ErrorStatus<TResponses>] extends [never]
  ? ResponseError<unknown, TRequest, TResponse>
  : {
      [TStatus in ErrorStatus<TResponses>]: ResponseError<DataOf<TResponses[TStatus]>, TRequest, TResponse> & {
        status: ToStatusNumber<TStatus, keyof TResponses>
      }
    }[ErrorStatus<TResponses>]

/**
 * Narrows a caught error to the `ResponseError` of an operation, typed by its responses record. The check is
 * `ResponseError.is`; the record is your claim about which call threw.
 *
 * @example
 * ```ts
 * try {
 *   await getPetById({ path: { petId: 7 } })
 * } catch (error) {
 *   if (isResponseError<GetPetByIdResponses>(error) && error.status === 404) error.data // GetPetById404
 * }
 * ```
 */
export function isResponseError<TResponses = unknown, TRequest = NativeRequest, TResponse = NativeResponse>(
  error: unknown,
): error is ResponseErrorOf<TResponses, TRequest, TResponse> {
  return ResponseError.is(error)
}

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

/** The value of a header, matched by name in any letter case. */
export function getHeader(headers: Record<string, string>, name: string): string | undefined {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase())
  return key ? headers[key] : undefined
}

function deleteHeader(headers: Record<string, string>, name: string): void {
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === name.toLowerCase()) delete headers[key]
  }
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

/**
 * Creates a transport-agnostic interceptor channel that runs interceptors in registration order. Each handler gets the
 * value the one before it returned, and a handler that returns nothing keeps the value.
 */
export function createInterceptorStack<T, TContext = never, TResult = T>(): InterceptorStack<T, TContext, TResult> {
  let entries: Array<{ id: number; fn: InterceptorFn<T, TContext, TResult> }> = []
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
    async run(value, context) {
      let result = value
      for (const entry of entries) {
        const next = await entry.fn(result, context)
        // `TResult` is `T` or a subtype of it, such as an `Error` on the error channel.
        if (next !== undefined) result = next as unknown as T
      }
      return result
    },
  }
}

function placeToken({ scheme, token, headers, query }: { scheme: Auth; token: string; headers: Record<string, string>; query: Record<string, unknown> }): void {
  if (scheme.type !== 'apiKey') {
    if (getHeader(headers, 'Authorization') === undefined) {
      headers['Authorization'] = scheme.scheme === 'basic' ? `Basic ${btoa(String.fromCharCode(...new TextEncoder().encode(token)))}` : `Bearer ${token}`
    }
    return
  }
  const name = scheme.name ?? 'Authorization'
  if (scheme.in === 'query') {
    if (query[name] === undefined) query[name] = token
    return
  }
  if (scheme.in === 'cookie') {
    appendCookie(headers, `${name}=${token}`)
    return
  }
  if (getHeader(headers, name) === undefined) headers[name] = token
}

/**
 * Walks the per-operation security requirements in order and places the tokens of the first one whose schemes all
 * resolve a token, mutating `headers` / `query` in place. A requirement is one scheme, or an array of schemes sent together.
 */
export async function resolveAuth(params: {
  security: Array<SecurityRequirement> | undefined
  auth: AuthResolver | undefined
  headers: Record<string, string>
  query: Record<string, unknown>
}): Promise<void> {
  const { security, auth, headers, query } = params
  if (!security?.length || auth === undefined) return

  for (const requirement of security) {
    const schemes = Array.isArray(requirement) ? requirement : [requirement]
    const tokens = await Promise.all(schemes.map((scheme) => (typeof auth === 'function' ? auth(scheme) : auth)))
    if (tokens.some((token) => token === undefined)) continue
    schemes.forEach((scheme, index) => placeToken({ scheme, token: tokens[index]!, headers, query }))
    return
  }
}

/** Adds a cookie to the `Cookie` header, under the key the caller used in any casing. */
function appendCookie(headers: Record<string, string>, cookie: string): void {
  const key = Object.keys(headers).find((name) => name.toLowerCase() === 'cookie') ?? 'Cookie'
  headers[key] = [headers[key], cookie].filter(Boolean).join('; ')
}

/** The media type of the `Content-Type` response header, without its parameters. */
export function getResponseContentType(headers: Headers | Record<string, string> | undefined): string | undefined {
  if (!headers) return undefined
  // A `Headers` from another realm or a polyfill such as node-fetch is not `instanceof` the global one, so check for `get`.
  const value =
    typeof headers.get === 'function'
      ? (headers as Headers).get('Content-Type')
      : ((headers as Record<string, string>)['Content-Type'] ?? (headers as Record<string, string>)['content-type'])
  return baseContentType(value)
}

/**
 * The `RequestInit` of a resolved request, for `fetch` and any library that takes the same init, such as ky. The
 * request's `options` go first, so the method, headers, body, signal, and credentials the client resolved win.
 *
 * @example
 * ```ts
 * client.setConfig({ transport: (request) => ky(request.url, { ...toRequestInit(request), throwHttpErrors: false, retry: 0, timeout: false }) })
 * ```
 */
export function toRequestInit(request: ResolvedRequest): RequestInit {
  const init: RequestInit = {
    ...request.options,
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
  }
  if (request.credentials) init.credentials = request.credentials
  return init
}

/** Picks the error validator for `status`: the exact status, then its range such as `5XX`, then `default`. */
function pickErrorValidator(error: Validator | Record<string, Validator> | undefined, status: number): Validator | undefined {
  if (!error || '~standard' in error) return error as Validator | undefined
  const range = Object.keys(error).find((key) => key.toUpperCase() === `${String(status)[0]}XX`)
  return error[String(status)] ?? (range ? error[range] : undefined) ?? error.default
}

/**
 * Whether a transport returned a web `Response` instead of a transport result. It checks the shape, so a `Response`
 * from another realm or a polyfill such as node-fetch counts too.
 */
function isResponse(value: unknown): value is Response {
  return typeof (value as Response | undefined)?.arrayBuffer === 'function'
}

/**
 * The `Request` a transport that returns a plain `Response` would have sent, for `result.request`. It leaves out the
 * body, which was already sent, so a large body is not copied again. A relative URL or a runtime without `Request` keeps
 * the resolved request.
 */
function toNativeRequest(request: ResolvedRequest): Request | ResolvedRequest {
  try {
    return new Request(request.url, { ...toRequestInit(request), body: undefined })
  } catch {
    return request
  }
}

async function readAs(response: Response, parseAs: ParseAs): Promise<unknown> {
  switch (parseAs) {
    case 'text':
      return response.text()
    case 'blob':
      return response.blob()
    case 'arrayBuffer':
      return response.arrayBuffer()
    case 'stream':
      return response.body ?? undefined
  }
  return defaultMediaTypes['application/json']?.decode?.(response, { contentType: 'application/json', config: {} })
}

/** Whether a response has no body to decode: 204, 205, 304, a HEAD request, or a body the transport left out. */
function isEmpty(response: Response, method: string): boolean {
  return [204, 205, 304].includes(response.status) || method === 'HEAD' || !response.body || response.headers.get('Content-Length') === '0'
}

function mergeConfig<T extends { headers?: HeadersInit; mediaTypes?: MediaTypes }>(config: T, next: T): T {
  return {
    ...config,
    ...next,
    headers: { ...serializeHeaders(config.headers), ...serializeHeaders(next.headers) },
    mediaTypes: { ...config.mediaTypes, ...next.mediaTypes },
  }
}

function resolveSerializers({ config, requestConfig }: { config: { serializer?: Serializers }; requestConfig: { serializer?: Serializers } }) {
  return {
    querySerializer: requestConfig.serializer?.query ?? config.serializer?.query ?? defaultQuerySerializer,
    pathSerializer: requestConfig.serializer?.path ?? config.serializer?.path ?? defaultPathSerializer,
  }
}

async function resolveRequest<TBody, TRequest, TResponse>({
  config,
  requestConfig,
}: {
  config: ClientConfig<TRequest, TResponse>
  requestConfig: RequestConfig<TBody, TRequest, TResponse>
}): Promise<{ request: ResolvedRequest; mediaTypes: MediaTypes; validate: ValidateOption | undefined; responseContentType: string | undefined }> {
  const { querySerializer, pathSerializer } = resolveSerializers({ config, requestConfig })
  const mediaTypes = { ...defaultMediaTypes, ...config.mediaTypes, ...requestConfig.mediaTypes }
  const onValidationError = requestConfig.onValidationError ?? config.onValidationError
  const validate = requestConfig.validate ?? config.validate
  const validationContext = { direction: 'request', method: requestConfig.method, url: requestConfig.url } as const

  // Params are encoded before anything reads them: headers before styling, query before auth adds its values.
  const paramValues = {
    path: { ...(requestConfig.path as Record<string, unknown> | undefined) },
    query: { ...((requestConfig.query ?? requestConfig.params) as Record<string, unknown> | undefined) },
    headers: collectHeadersCaseInsensitive(config.headers, requestConfig.headers),
    cookies: requestConfig.cookies as Record<string, unknown> | undefined,
  }
  const [validatedPath, validatedQuery, validatedHeaders, validatedCookies] = await Promise.all(
    (['path', 'query', 'headers', 'cookies'] as const).map((source) =>
      runValidator({
        validator: isValidationEnabled(validate, 'params') && paramValues[source] !== undefined ? requestConfig.validator?.[source] : undefined,
        value: paramValues[source],
        context: { ...validationContext, source },
        onValidationError,
      }),
    ),
  )

  const headers = serializeHeaders(applyHeaderStyles(validatedHeaders as HeadersInit | undefined, requestConfig.styles?.header))
  const contentType = requestConfig.contentType
  const { request: requestContentTypeOption, response: responseContentType } = typeof contentType === 'string' ? { request: contentType } : (contentType ?? {})
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

  const cookie = validatedCookies ? serializeCookies(validatedCookies as Record<string, unknown>, requestConfig.styles?.cookie) : ''
  if (cookie) appendCookie(headers, cookie)

  const validatedBody = await runValidator({
    validator: isValidationEnabled(validate, 'request') ? requestConfig.validator?.request : undefined,
    value: requestConfig.body,
    context: { ...validationContext, source: 'body' },
    onValidationError,
  })
  // A value that is not already encoded, sent without a content type, goes out as JSON, labeled so.
  const requestContentType = requestContentTypeOption ?? getHeader(headers, 'content-type') ?? (isEncodedBody(validatedBody) ? undefined : 'application/json')
  const body =
    validatedBody === undefined || validatedBody === null
      ? undefined
      : resolveMediaType({ mediaTypes, contentType: requestContentType, use: 'encode' })?.encode?.(validatedBody, {
          contentType: requestContentType ?? '',
          signal: requestConfig.signal,
          config: requestConfig,
        })
  // The operation's content type replaces a `content-type` header in any letter case, and is left off when there is no body to label.
  if (body !== undefined && requestContentType && getHeader(headers, 'content-type') !== requestContentType) {
    deleteHeader(headers, 'content-type')
    headers['Content-Type'] = requestContentType
  }
  // The transport must set the multipart boundary, even when a content type was explicitly provided.
  if (body instanceof FormData) deleteHeader(headers, 'content-type')

  const url = serializeUrl({
    parts: [requestConfig.baseURL ?? config.baseURL, requestConfig.url],
    pathParams: (validatedPath ?? {}) as Record<string, unknown>,
    search: querySerializer(query, requestConfig.styles?.query),
    pathSerializer,
    pathStyles: requestConfig.styles?.path,
  })

  const options = config.options || requestConfig.options ? { ...config.options, ...requestConfig.options } : undefined
  const accept = getHeader(headers, 'accept')

  return {
    mediaTypes,
    validate,
    responseContentType,
    request: {
      url,
      method: (requestConfig.method ?? 'GET').toUpperCase(),
      headers,
      body,
      // A signal passed in `options` counts too, since every transport spreads `options` under the resolved fields.
      signal: requestConfig.signal ?? (options as { signal?: AbortSignal } | undefined)?.signal,
      credentials: requestConfig.credentials ?? config.credentials,
      options,
      stream:
        requestConfig.parseAs === 'stream' || Boolean(accept?.split(',').some((type) => resolveMediaType({ mediaTypes, contentType: type, use: 'stream' }))),
    },
  }
}

/**
 * Reads stream items, validating each one by `eventShape`. A consumer `break` or a failed item closes the loop, which
 * cancels the reader, and an aborted signal ends it with the signal's reason right after the item the consumer saw.
 */
async function* readItems({
  items,
  validateItem,
  signal,
}: {
  items: AsyncIterable<unknown>
  validateItem: (item: unknown) => unknown
  signal: AbortSignal | undefined
}): AsyncGenerator<unknown> {
  try {
    for await (const item of items) {
      yield await validateItem(item)
      // A chunk may hold more items, so stop before the parser reads on.
      if (signal?.aborted) throw signal.reason
    }
  } catch (error) {
    // A transport reports an abort in its own error type, such as axios's `CanceledError`, so rethrow the signal's reason instead.
    throw signal?.aborted ? signal.reason : error
  }
}

/**
 * Creates an isolated client using the supplied default transport. `parent` is the interceptors a client made with
 * `extend` runs before its own.
 */
export function createClientCore<TRequest = NativeRequest, TResponse = NativeResponse>(
  options: { defaultTransport: Transport<TRequest, TResponse> } & ClientConfig<TRequest, TResponse>,
  parent?: Interceptors<TRequest, TResponse>,
): ClientInstance<TRequest, TResponse> {
  const { defaultTransport, ...initialConfig } = options
  let config: ClientConfig<TRequest, TResponse> = { ...initialConfig }

  const own: Interceptors<TRequest, TResponse> = {
    request: createInterceptorStack(),
    response: createInterceptorStack(),
    error: createInterceptorStack(),
  }
  const run = {
    request: async (value: ResolvedRequest, context?: RequestConfig<unknown, TRequest, TResponse>) =>
      own.request.run(parent ? await parent.request.run(value, context) : value, context),
    response: async (value: DecodedResponse<unknown, TRequest, TResponse>, context?: RequestConfig<unknown, TRequest, TResponse>) =>
      own.response.run(parent ? await parent.response.run(value, context) : value, context),
    error: async (value: Error, context?: RequestConfig<unknown, TRequest, TResponse>) =>
      own.error.run(parent ? await parent.error.run(value, context) : value, context),
  }

  async function send(requestConfig: RequestConfig<unknown, TRequest, TResponse> & EventStreamOptions, streaming: boolean) {
    const transport = requestConfig.transport ?? config.transport ?? defaultTransport
    // Read before the first await, so a `setConfig` while the call runs does not change it.
    const throwOnError = requestConfig.throwOnError ?? config.throwOnError ?? true
    const onValidationError = requestConfig.onValidationError ?? config.onValidationError
    const { request, mediaTypes, validate, responseContentType } = await resolveRequest({ config, requestConfig })
    if (streaming) request.stream = true

    const resolvedRequest = await run.request(request, requestConfig)
    const sent = await transport(resolvedRequest)
    const {
      webResponse,
      request: nativeRequest,
      response: nativeResponse,
    } = isResponse(sent) ? { webResponse: sent, request: toNativeRequest(resolvedRequest) as TRequest, response: sent as TResponse & Response } : sent

    const status = webResponse.status
    const isSuccess = status >= 200 && status < 300
    const header = webResponse.headers.get('Content-Type')
    // A 2xx answer without a `Content-Type` is read as the media type the call asked for, then as `*/*`.
    const contentType = header ?? (isSuccess ? responseContentType : undefined) ?? '*/*'
    const context: MediaTypeContext = { contentType, status, signal: resolvedRequest.signal, config: requestConfig, cursor: { lastEventId: '' } }
    const streamType = isSuccess ? resolveMediaType({ mediaTypes, contentType, use: 'stream' }) : undefined
    const decode = async (): Promise<unknown> => {
      if (isEmpty(webResponse, resolvedRequest.method)) return undefined
      // A stream body stays a stream: `stream` reads it item by item, and a regular call hands it over as is.
      if (streamType) return webResponse.body
      if (isSuccess && requestConfig.parseAs) return readAs(webResponse, requestConfig.parseAs)
      return resolveMediaType({ mediaTypes, contentType, use: 'decode' })?.decode?.(webResponse, context)
    }

    const result = await run.response(
      {
        data: await decode(),
        status,
        statusText: webResponse.statusText,
        headers: webResponse.headers,
        contentType: baseContentType(header),
        request: nativeRequest,
        response: nativeResponse,
      },
      requestConfig,
    )

    const validator = requestConfig.validator
    const resultSuccess = result.status >= 200 && result.status < 300
    const direction = resultSuccess ? 'response' : 'error'
    const validationContext = { direction, source: 'body', method: resolvedRequest.method, url: resolvedRequest.url, status: result.status } as const
    const validatorFor = isValidationEnabled(validate, direction)
      ? resultSuccess
        ? validator?.response
        : pickErrorValidator(validator?.error, result.status)
      : undefined
    // A stream body is never validated as a whole: a stream call validates each item, and a regular call hands the stream over.
    const rawStream = result.data instanceof ReadableStream
    const readsItems = streaming && resultSuccess && streamType?.stream !== undefined && rawStream

    if (streaming && resultSuccess && !readsItems && result.data != null) {
      // `cause` is assigned, since the constructor option needs the ES2022 library a generated client cannot assume.
      throw Object.assign(new TypeError(`Expected a streamed body, got ${result.contentType ?? 'a body without a content type'}`), { cause: result.data })
    }

    const data = rawStream ? result.data : await runValidator({ validator: validatorFor, value: result.data, context: validationContext, onValidationError })
    if (!resultSuccess && throwOnError) {
      throw new ResponseError({
        data,
        status: result.status,
        statusText: result.statusText,
        contentType: result.contentType,
        request: result.request,
        response: result.response,
        method: resolvedRequest.method,
        url: resolvedRequest.url,
      })
    }

    const validateItem = (item: unknown) => {
      if (!validatorFor) return item
      const shape = requestConfig.eventShape
      const value = shape === 'data' ? (item as ServerSentEvent).data : item
      return runValidator({ validator: validatorFor, value, context: validationContext, onValidationError }).then((validated) =>
        // The schema may not declare `id` and `retry`, so the parsed value is merged over the event instead of replacing it.
        shape === 'data'
          ? { ...(item as ServerSentEvent), data: validated }
          : shape === 'event'
            ? { ...(item as object), ...(validated as object) }
            : validated,
      )
    }
    const items = readsItems && streamType?.stream ? streamType.stream(result.data as ReadableStream<Uint8Array>, context) : undefined
    return {
      cursor: context.cursor!,
      items: readItems({ items: items ?? emptyItems(), validateItem, signal: resolvedRequest.signal }),
      result: {
        status: result.status,
        data: resultSuccess ? data : undefined,
        // An empty error body still reports the failure, so `if (error)` and `.unwrap()` see a value.
        error: resultSuccess
          ? undefined
          : data == null || data === ''
            ? ({ status: result.status, statusText: result.statusText } satisfies EmptyErrorBody)
            : data,
        contentType: result.contentType,
        request: result.request,
        response: result.response,
      },
    }
  }

  // Every failure of a call goes through the error interceptors once, before it reaches the caller.
  async function call<T>(requestConfig: RequestConfig<unknown, TRequest, TResponse>, work: () => Promise<T>): Promise<T> {
    const signal = requestConfig.signal ?? (requestConfig.options as { signal?: AbortSignal } | undefined)?.signal
    try {
      return await work()
    } catch (caught) {
      // A transport reports an abort in its own error type, such as axios's `CanceledError`, so the signal's reason wins.
      const error: unknown = signal?.aborted ? signal.reason : caught
      throw error instanceof Error ? await run.error(error, requestConfig) : error
    }
  }

  const client = (<TResponses, ThrowOnError extends boolean>(requestConfig: RequestConfig<unknown, TRequest, TResponse>) =>
    call(
      requestConfig,
      async () => (await send(requestConfig, false)).result as RequestResult<TResponses, ThrowOnError, TRequest, TResponse>,
    )) as ClientInstance<TRequest, TResponse>

  client.stream = <TResponses, ThrowOnError extends boolean, TItem>(requestConfig: RequestConfig<unknown, TRequest, TResponse> & EventStreamOptions) =>
    call(requestConfig, async () => {
      const { result, items, cursor } = await send(requestConfig, true)
      const stream = items as AsyncGenerator<TItem>
      const streamed = {
        ...result,
        stream,
        data: result.error === undefined ? stream : undefined,
        get lastEventId() {
          return cursor.lastEventId
        },
        [Symbol.asyncIterator]: () => stream,
      }
      return streamed as unknown as StreamResult<TResponses, ThrowOnError, TItem, TRequest, TResponse>
    })

  client.getConfig = () => config
  client.setConfig = (next) => {
    config = mergeConfig(config, next)
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
  client.interceptors = own
  client.createClient = (next = {}) => createClientCore({ defaultTransport, ...mergeConfig(config, next) })
  client.extend = (next = {}) =>
    createClientCore(
      { defaultTransport, ...mergeConfig(config, next) },
      { request: { ...own.request, run: run.request }, response: { ...own.response, run: run.response }, error: { ...own.error, run: run.error } },
    )

  return client
}

async function* emptyItems(): AsyncGenerator<unknown> {}

/**
 * A client that is created on first use, so importing a generated operation runs no setup. `setConfig` before that is
 * kept and passed to `create`.
 *
 * @example
 * ```ts
 * export const client = createLazyClient((config) => createClientCore({ defaultTransport, ...config }))
 * ```
 */
export function createLazyClient<TRequest = NativeRequest, TResponse = NativeResponse>(
  create: (config: ClientConfig<TRequest, TResponse>) => ClientInstance<TRequest, TResponse>,
): ClientInstance<TRequest, TResponse> {
  let instance: ClientInstance<TRequest, TResponse> | undefined
  let pending: ClientConfig<TRequest, TResponse> = {}
  const get = () => (instance ??= create(pending))

  const client = (<TResponses, ThrowOnError extends boolean>(requestConfig: RequestConfig<unknown, TRequest, TResponse> & { throwOnError?: ThrowOnError }) =>
    get()<TResponses, ThrowOnError>(requestConfig)) as ClientInstance<TRequest, TResponse>
  client.stream = (requestConfig) => get().stream(requestConfig)
  client.getConfig = () => instance?.getConfig() ?? pending
  client.setConfig = (next) => (instance ? instance.setConfig(next) : (pending = mergeConfig(pending, next)))
  client.getUrl = (requestConfig) => get().getUrl(requestConfig)
  client.createClient = (next) => get().createClient(next)
  client.extend = (next) => get().extend(next)
  Object.defineProperty(client, 'interceptors', { get: () => get().interceptors, enumerable: true })
  return client
}
