import type { NativeOptions, NativeRequest, NativeResponse } from './client'
import type { MediaTypes } from './mediaTypes'
import type { HeadersInit, HttpMethod, RequestBody, Serializers, Styles } from './serializers'
import type { StandardSchemaValidator, ValidateOption, ValidationErrorHandler } from './standardSchema'
export type { ValidateOption, ValidationErrorContext, ValidationErrorHandler } from './standardSchema'

/**
 * The status keys that count as success. `2xx` covers every 2xx status.
 */
export type SuccessStatusCode = '200' | '201' | '202' | '203' | '204' | '205' | '206' | '207' | '208' | '226' | '2xx'

export type SuccessOf<TResponses> = TResponses[Extract<keyof TResponses, SuccessStatusCode>]

export type ErrorOf<TResponses> = TResponses[Exclude<keyof TResponses, SuccessStatusCode>]

type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

type ToNumber<T> = T extends `${infer TNumber extends number}` ? TNumber : never

/**
 * Maps a status key such as `404` or `4xx` to its numeric statuses. `default` becomes `number`.
 */
export type ToStatusNumber<TStatus, TKeys = never> = TStatus extends `${infer TNumber extends number}`
  ? TNumber
  : TStatus extends `${infer TFirst extends '1' | '2' | '3' | '4' | '5'}xx`
    ? Exclude<ToNumber<`${TFirst}${Digit}${Digit}`>, ToNumber<TKeys>>
    : number

/**
 * The `error` of a failed call without a body, so `if (error)` still sees the failure.
 */
export type EmptyErrorBody = { status: number; statusText: string }

export type DataOf<T> = T extends { contentType: string; data: infer TData } ? TData : T

/**
 * A response's `Headers`, whose `get` suggests the header names the spec declares. Values stay strings, as sent.
 */
export type ResponseHeaders<THeaders = unknown> = Omit<Headers, 'get'> & {
  get: (name: Extract<keyof THeaders, string> | (string & {})) => string | null
}

// The media types `streamMediaTypes` reads as a stream: a response with one of them resolves to its raw body.
type StreamContentType =
  | `text/event-stream${string}`
  | `application/jsonl${string}`
  | `application/x-ndjson${string}`
  | `application/json-seq${string}`
  | `application/${string}+json-seq${string}`

type HeadersFor<THeaders, TStatus> = ResponseHeaders<TStatus extends keyof THeaders ? THeaders[TStatus] : unknown>

export type SuccessVariant<TStatus, TEntry, TRequest, TResponse, TKeys = never, THeaders = unknown> = TEntry extends { contentType: string; data: unknown }
  ? TEntry extends { contentType: infer TContentType; data: infer TData }
    ? {
        status: ToStatusNumber<TStatus, TKeys>
        data: TContentType extends StreamContentType ? ReadableStream<Uint8Array> : TData
        error: undefined
        contentType: TContentType
        headers: HeadersFor<THeaders, TStatus>
        request: TRequest
        response: TResponse
      }
    : never
  : {
      status: ToStatusNumber<TStatus, TKeys>
      data: TEntry
      error: undefined
      contentType: string | undefined
      headers: HeadersFor<THeaders, TStatus>
      request: TRequest
      response: TResponse
    }

export type ResultByStatus<TResponses, TStatus extends keyof TResponses, TRequest, TResponse, THeaders = unknown> = TStatus extends SuccessStatusCode
  ? SuccessVariant<TStatus, TResponses[TStatus], TRequest, TResponse, keyof TResponses, THeaders>
  : {
      status: ToStatusNumber<TStatus, keyof TResponses>
      data: undefined
      error: DataOf<TResponses[TStatus]> | EmptyErrorBody
      contentType: string | undefined
      headers: HeadersFor<THeaders, TStatus>
      request: TRequest
      response: TResponse
    }

export type ResultUnion<TResponses, TRequest, TResponse, THeaders = unknown> = {
  [TStatus in keyof TResponses]: ResultByStatus<TResponses, TStatus, TRequest, TResponse, THeaders>
}[keyof TResponses]

export type SuccessResultUnion<TResponses, TRequest, TResponse, THeaders = unknown> = {
  [TStatus in Extract<keyof TResponses, SuccessStatusCode>]: ResultByStatus<TResponses, TStatus, TRequest, TResponse, THeaders>
}[Extract<keyof TResponses, SuccessStatusCode>]

/**
 * The result of a call, narrowed by `status`. With `throwOnError`, it holds only the success variants. `THeaders` keys the
 * declared response headers by status like the responses record, so `headers.get` suggests them for the narrowed status.
 */
export type RequestResult<
  TResponses,
  ThrowOnError extends boolean = true,
  TRequest = NativeRequest,
  TResponse = NativeResponse,
  THeaders = unknown,
> = ThrowOnError extends true
  ? [SuccessResultUnion<TResponses, TRequest, TResponse, THeaders>] extends [never]
    ? {
        status: number
        data: SuccessOf<TResponses>
        error: undefined
        contentType: string | undefined
        headers: ResponseHeaders
        request: TRequest
        response: TResponse
      }
    : SuccessResultUnion<TResponses, TRequest, TResponse, THeaders>
  : [ResultUnion<TResponses, TRequest, TResponse, THeaders>] extends [never]
    ? { status: number; data: undefined; error: undefined; contentType: string | undefined; headers: ResponseHeaders; request: TRequest; response: TResponse }
    : ResultUnion<TResponses, TRequest, TResponse, THeaders>

/**
 * `RequestResult` with the declared response headers by status: `RequestResultWithHeaders<ListPetsResponses, { '200': ListPetsStatus200Headers }>`.
 */
export type RequestResultWithHeaders<TResponses, THeaders, ThrowOnError extends boolean = true> = RequestResult<
  TResponses,
  ThrowOnError,
  NativeRequest,
  NativeResponse,
  THeaders
>

/**
 * A result promise whose `unwrap()` resolves to the success body.
 */
export type Unwrappable<T extends { data: unknown; error: unknown }> = Promise<T> & {
  unwrap: () => Promise<Extract<T, { error: undefined }>['data']>
}

/**
 * Adds `unwrap()` to a result promise. It rejects with `error` when the result has one.
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

export type Unwrapped<T, ThrowOnError extends boolean> = ThrowOnError extends true ? (T extends { data: infer TData } ? TData : never) : T

/**
 * What an operation returns with `returnType: 'data'`: the success body, or the full result when `throwOnError` is false.
 */
export type UnwrappedResult<
  TResponses,
  ThrowOnError extends boolean = true,
  TRequest = NativeRequest,
  TResponse = NativeResponse,
  THeaders = unknown,
> = Unwrapped<RequestResult<TResponses, ThrowOnError, TRequest, TResponse, THeaders>, ThrowOnError>

/**
 * `UnwrappedResult` with the declared response headers by status, for the full result a `throwOnError: false` call resolves to.
 */
export type UnwrappedResultWithHeaders<TResponses, THeaders, ThrowOnError extends boolean = true> = UnwrappedResult<
  TResponses,
  ThrowOnError,
  NativeRequest,
  NativeResponse,
  THeaders
>

/**
 * Resolves to the success body when `throwOnError` is true, or to the full result when it is false.
 */
export function unwrapResult<T extends { data: unknown; error: unknown }, ThrowOnError extends boolean>(
  promise: Promise<T>,
  throwOnError: ThrowOnError,
): Promise<Unwrapped<T, ThrowOnError>> {
  return promise.then((result) => (throwOnError ? result.data : result) as Unwrapped<T, ThrowOnError>)
}

/**
 * The call's `throwOnError`, or the operation's generated default when the call leaves it unset.
 */
export function resolveThrowOnError<ThrowOnError extends boolean>(throwOnError: ThrowOnError | undefined, fallback: boolean): ThrowOnError {
  return (throwOnError ?? fallback) as ThrowOnError
}

export type DataShape = { body?: unknown; cookies?: unknown; headers?: unknown; path?: unknown; query?: unknown }

export type RequestCredentials = 'omit' | 'same-origin' | 'include'

/**
 * Reads a 2xx body as this format instead of by its media type. An error body still uses its media type.
 */
export type ParseAs = 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'

/**
 * The request content type, or `{ request, response }` to also set `Accept`.
 */
export type ContentType = string | { request?: string; response?: string }

export type Validator<T = unknown> = StandardSchemaValidator<T>



/**
 * A security scheme of a generated call, passed to the `auth` resolver. OAuth2 `flows` and `metadataUrl` (RFC 8414) and
 * the OpenID Connect `url` tell the resolver where to get a token.
 */
export type Auth = {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect'
  scheme?: 'bearer' | 'basic'
  name?: string
  in?: 'header' | 'query' | 'cookie'
  scopes?: Array<string>
  flows?: Record<string, { authorizationUrl?: string; deviceAuthorizationUrl?: string; tokenUrl?: string; refreshUrl?: string }>
  metadataUrl?: string
  url?: string
}

/**
 * One scheme, or the schemes one requirement sends together.
 */
export type SecurityRequirement = Auth | Array<Auth>

/**
 * `user:password` for basic auth, or `undefined` to skip the scheme.
 */
export type AuthToken = string | undefined

/**
 * A static token, or a callback per scheme. The first requirement whose schemes all get a token is sent.
 */
export type AuthResolver = AuthToken | ((auth: Auth) => AuthToken | Promise<AuthToken>)

/**
 * One Server-Sent Event. `data` is parsed JSON when it parses, otherwise the raw string.
 */
export type ServerSentEvent<TData = unknown> = {
  data: TData
  event: string
  id?: string
  retry?: number
}

/**
 * An event the document types by name, plus the `id` and `retry` any event may carry.
 */
export type TypedEvent<TEvent> = TEvent & Pick<ServerSentEvent, 'id' | 'retry'>

/**
 * Per-call options of a stream operation.
 */
export type EventStreamOptions = {
  /**
   * The most characters one event or JSON line may hold. A larger one throws a `RangeError`, and `Infinity` turns the limit off.
   * @default 16777216
   */
  maxEventSize?: number | undefined
  /**
   * Ends the stream when an event's raw `data` or a JSON line equals this value, such as `[DONE]`.
   */
  terminator?: string | undefined
  /**
   * Maps each Server-Sent Event before validation.
   */
  transform?: (event: ServerSentEvent) => ServerSentEvent
  /**
   * What `validator.response` checks on each event: the payload (`data`) or the whole event (`event`).
   */
  eventShape?: 'event' | 'data'
  /**
   * Keeps each Server-Sent Event's `data` as the raw text instead of JSON-parsing it. The generated client sets it when the
   * document types `data` as a string. A list of event names keeps it for those events only.
   */
  rawData?: boolean | Array<string> | undefined
}

/**
 * What `shouldRetry` and `onRetry` get. A failed attempt has a `response`, or the `error` its transport threw.
 */
export type RetryContext = {
  request: ResolvedRequest
  response?: Response | undefined
  error?: unknown
  /**
   * The retry about to run, counted from 1.
   */
  retryCount: number
}

/**
 * The statuses that are commonly retried, for autocomplete. Any other status is accepted too.
 */
export type RetryStatusCode = 408 | 413 | 425 | 429 | 500 | 502 | 503 | 504 | (number & {})

export type RetryOptions = {
  /**
   * How many times a call is sent again after its first attempt. A dropped Server-Sent Events stream draws on the same count.
   * @default 2
   */
  limit?: number | undefined
  /**
   * The methods that are safe to send twice.
   * @default ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'TRACE']
   */
  methods?: Array<HttpMethod> | undefined
  /**
   * @default [408, 429, 500, 502, 503, 504]
   */
  statusCodes?: Array<RetryStatusCode> | undefined
  /**
   * The wait in milliseconds before a retry. A `Retry-After` header wins over it. The default backs off exponentially from
   * 300 ms with jitter, up to 30 seconds.
   */
  delay?: ((retryCount: number) => number) | undefined
  /**
   * Overrides the status and error check. Return `undefined` to keep the default decision. The limit, the methods, and the
   * abort signal still apply.
   */
  shouldRetry?: ((context: RetryContext) => boolean | undefined | Promise<boolean | undefined>) | undefined
  /**
   * Runs before the wait of each retry.
   */
  onRetry?: ((context: RetryContext & { delay: number }) => void | Promise<void>) | undefined
}

/**
 * A retry limit, the retry options, or `false` to send the call once. Retries are off unless set.
 */
export type Retry = false | number | RetryOptions

export type RequestConfig<TBody = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = {
  baseURL?: string
  url?: string
  method?: HttpMethod
  path?: unknown
  query?: unknown
  /**
   * Alias of `query`.
   */
  params?: unknown
  cookies?: unknown
  body?: TBody
  headers?: unknown
  styles?: Styles | undefined
  signal?: AbortSignal | undefined
  credentials?: RequestCredentials | undefined
  options?: NativeOptions | undefined
  contentType?: ContentType
  parseAs?: ParseAs
  throwOnError?: boolean
  client?: ClientInstance<TRequest, TResponse>
  transport?: Transport<TRequest, TResponse>
  serializer?: Serializers
  /**
   * Merged per key over the client's media types.
   */
  mediaTypes?: MediaTypes
  /**
   * `error` takes one validator, or a map by status such as `{ 404: schema, '5xx': schema, default: schema }`.
   */
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
  /**
   * Merged per field over the client's `retry`.
   */
  retry?: Retry | undefined
}

/**
 * The options of a generated operation: its typed request groups plus the call config.
 */
export type Options<TData extends DataShape, ThrowOnError extends boolean = true, TRequest = NativeRequest, TResponse = NativeResponse> = Omit<
  RequestConfig<unknown, TRequest, TResponse>,
  keyof DataShape | 'url'
> &
  TData & {
    client?: ClientInstance<TRequest, TResponse>
    throwOnError?: ThrowOnError
  }

export type StreamOptions<TData extends DataShape, ThrowOnError extends boolean = true> = Options<TData, ThrowOnError> & EventStreamOptions

/**
 * Config shared by every call of a client. A call's own config overrides it.
 */
export type ClientConfig<TRequest = NativeRequest, TResponse = NativeResponse> = {
  baseURL?: string
  headers?: HeadersInit | Headers
  credentials?: RequestCredentials
  options?: NativeOptions
  throwOnError?: boolean
  transport?: Transport<TRequest, TResponse>
  serializer?: Serializers
  /**
   * Merged per key over `defaultMediaTypes`.
   */
  mediaTypes?: MediaTypes
  onValidationError?: ValidationErrorHandler
  validate?: ValidateOption
  auth?: AuthResolver
  /**
   * Sends a failed call again: a transport error, or a status in `statusCodes`.
   */
  retry?: Retry | undefined
}

/**
 * The request a transport sends, with its URL, headers, body, and auth already resolved.
 */
export type ResolvedRequest = {
  url: string
  method: string
  headers: Record<string, string>
  body?: RequestBody | undefined
  signal?: AbortSignal | undefined
  credentials?: RequestCredentials | undefined
  options?: NativeOptions | undefined
  /**
   * Read the response as a stream. A transport that buffers bodies, such as axios, must stream it.
   */
  stream?: boolean
  /**
   * The client retries this call itself. A transport with its own retry, such as Ky, switches that off.
   */
  retry?: boolean
}

/**
 * A transport's `Response` with the native request and response that results and errors carry.
 */
export type TransportResult<TRequest = NativeRequest, TResponse = NativeResponse> = {
  webResponse: Response
  request: TRequest
  response: TResponse
}

/**
 * Sends a resolved request and returns its `Response` with the body unread. The client decodes it.
 */
export type Transport<TRequest = NativeRequest, TResponse = NativeResponse> = (
  request: ResolvedRequest,
) => Promise<Response | TransportResult<TRequest, TResponse>>

/**
 * What a response interceptor gets: the decoded body with the status, headers, and native objects.
 */
export type DecodedResponse<TData = unknown, TRequest = NativeRequest, TResponse = NativeResponse> = {
  data: TData
  status: number
  statusText: string
  headers: Headers
  contentType?: string | undefined
  request: TRequest
  response: TResponse
}

export type InterceptorFn<T, TContext = never, TResult = T> = (value: T, context?: TContext) => TResult | Promise<TResult>

export type InterceptorStack<T, TContext = never, TResult = T> = {
  use: (fn: InterceptorFn<T, TContext, TResult>) => number
  eject: (id: number) => void
  update: (id: number, fn: InterceptorFn<T, TContext, TResult>) => void
  run: (value: T, context?: TContext) => Promise<T>
}

export type Interceptors<TRequest = NativeRequest, TResponse = NativeResponse> = {
  /**
   * Sees the resolved request before it is sent. Return a request to replace it, or nothing to keep it.
   */
  request: InterceptorStack<ResolvedRequest, RequestConfig<unknown, TRequest, TResponse>, ResolvedRequest | void>
  /**
   * Sees the decoded response. Return a response to replace it, or nothing to keep it.
   */
  response: InterceptorStack<
    DecodedResponse<unknown, TRequest, TResponse>,
    RequestConfig<unknown, TRequest, TResponse>,
    DecodedResponse<unknown, TRequest, TResponse> | void
  >
  /**
   * Sees a failed call: a `ResponseError`, a network error, an abort, or a validation error. Return another error to throw it instead.
   * An error thrown while a stream is read, after its response arrived, reaches the loop that reads it and not this stack.
   */
  error: InterceptorStack<ResponseError<unknown, TRequest, TResponse> | Error, RequestConfig<unknown, TRequest, TResponse>, Error | void>
}

export type UrlConfig = Pick<RequestConfig, 'baseURL' | 'url' | 'path' | 'query' | 'params' | 'serializer' | 'styles'>

type StreamParts<TEvent> = AsyncIterable<TEvent> & {
  stream: AsyncGenerator<TEvent>
  /**
   * The last event ID the server sent, for a `Last-Event-ID` header on a new call.
   */
  readonly lastEventId: string
}

type WithEvents<TResult, TEvent> = TResult extends { error: undefined } ? Omit<TResult, 'data'> & { data: AsyncGenerator<TEvent> } : TResult

/**
 * The result of a stream call. Iterate it, or its `data`, for the items. A failed call yields none.
 */
export type StreamResult<
  TResponses,
  ThrowOnError extends boolean = true,
  TEvent = ServerSentEvent<SuccessOf<TResponses>>,
  TRequest = NativeRequest,
  TResponse = NativeResponse,
  THeaders = unknown,
> = WithEvents<RequestResult<TResponses, ThrowOnError, TRequest, TResponse, THeaders>, TEvent> & StreamParts<TEvent>

/**
 * `StreamResult` with the declared response headers by status: `StreamResultWithHeaders<StreamEventsResponses, { '200': StreamEventsStatus200Headers }>`.
 */
export type StreamResultWithHeaders<TResponses, THeaders, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>> = StreamResult<
  TResponses,
  ThrowOnError,
  TEvent,
  NativeRequest,
  NativeResponse,
  THeaders
>

/**
 * What a stream operation returns with `returnType: 'data'`.
 */
export type UnwrappedStreamResult<
  TResponses,
  ThrowOnError extends boolean = true,
  TEvent = ServerSentEvent<SuccessOf<TResponses>>,
  THeaders = unknown,
> = Unwrapped<StreamResult<TResponses, ThrowOnError, TEvent, NativeRequest, NativeResponse, THeaders>, ThrowOnError>

/**
 * `UnwrappedStreamResult` with the declared response headers by status, for the full result a `throwOnError: false` call resolves to.
 */
export type UnwrappedStreamResultWithHeaders<
  TResponses,
  THeaders,
  ThrowOnError extends boolean = true,
  TEvent = ServerSentEvent<SuccessOf<TResponses>>,
> = UnwrappedStreamResult<TResponses, ThrowOnError, TEvent, THeaders>

/**
 * A client. Call it to send a request.
 */
export type ClientInstance<TRequest = NativeRequest, TResponse = NativeResponse> = {
  <TResponses = unknown, ThrowOnError extends boolean = true, THeaders = unknown>(
    config: RequestConfig<unknown, TRequest, TResponse> & { throwOnError?: ThrowOnError },
  ): Promise<RequestResult<TResponses, ThrowOnError, TRequest, TResponse, THeaders>>
  /**
   * Sends the request and reads a 2xx body item by item. A body whose media type cannot stream throws a `TypeError`.
   */
  stream: <TResponses = unknown, ThrowOnError extends boolean = true, TItem = ServerSentEvent<SuccessOf<TResponses>>, THeaders = unknown>(
    config: RequestConfig<unknown, TRequest, TResponse> & EventStreamOptions & { throwOnError?: ThrowOnError },
  ) => Promise<StreamResult<TResponses, ThrowOnError, TItem, TRequest, TResponse, THeaders>>
  getConfig: () => ClientConfig<TRequest, TResponse>
  setConfig: (config: ClientConfig<TRequest, TResponse>) => ClientConfig<TRequest, TResponse>
  getUrl: (config: UrlConfig) => string
  interceptors: Interceptors<TRequest, TResponse>
  /**
   * A client with this config and no interceptors.
   */
  createClient: (config?: ClientConfig<TRequest, TResponse>) => ClientInstance<TRequest, TResponse>
  /**
   * A client with this config that runs this client's interceptors before its own.
   */
  extend: (config?: ClientConfig<TRequest, TResponse>) => ClientInstance<TRequest, TResponse>
}

/**
 * Thrown for a non-2xx response when `throwOnError` is true.
 */
export class ResponseError<TError = unknown, TRequest = NativeRequest, TResponse = NativeResponse> extends Error {
  data: TError
  status: number
  statusText: string
  contentType: string | undefined
  /**
   * The response's `Headers`, the same on every transport.
   */
  headers: ResponseHeaders
  request: TRequest
  response: TResponse

  constructor(config: {
    data: TError
    status: number
    statusText: string
    contentType?: string | undefined
    headers?: Headers | undefined
    request: TRequest
    response: TResponse
    method?: string | undefined
    url?: string | undefined
  }) {
    // The query and hash stay out of the message, so secrets in them do not reach logs.
    const cleanUrl = config.url?.split(/[?#]/)[0]
    const target = [config.method, cleanUrl].filter(Boolean).join(' ')
    const statusText = config.statusText?.trim()
    super(`${target ? `${target} failed` : 'Request failed'} with status ${config.status}${statusText ? ` ${statusText}` : ''}`)
    this.name = 'ResponseError'
    this.data = config.data
    this.status = config.status
    this.statusText = config.statusText
    this.contentType = config.contentType
    this.headers = config.headers ?? new Headers()
    this.request = config.request
    this.response = config.response
  }

  /**
   * Matches on `name`, since every generated client has its own `ResponseError` class.
   */
  static is(error: unknown): error is ResponseError<unknown, unknown, unknown> {
    return error instanceof Error && error.name === 'ResponseError'
  }
}

export type ResponseErrorConfig<TError = unknown> = ResponseError<TError>

type ErrorStatus<TResponses> = Exclude<keyof TResponses, SuccessStatusCode>

/**
 * The `ResponseError` an operation throws. Checking `status` narrows `data` to that status's body, and `headers.get` to
 * the header names in `THeaders`, the same record `RequestResult` takes. A `default` response matches every status, so its
 * body stays in `data` after a `status` check.
 */
export type ResponseErrorOf<TResponses, TRequest = NativeRequest, TResponse = NativeResponse, THeaders = unknown> = [ErrorStatus<TResponses>] extends [never]
  ? ResponseError<unknown, TRequest, TResponse>
  : {
      [TStatus in ErrorStatus<TResponses>]: ResponseError<DataOf<TResponses[TStatus]>, TRequest, TResponse> & {
        status: ToStatusNumber<TStatus, keyof TResponses>
        headers: HeadersFor<THeaders, TStatus>
      }
    }[ErrorStatus<TResponses>]

/**
 * Narrows a caught error to the `ResponseError` of the operation whose responses record you pass.
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
export function isResponseError<TResponses = unknown, TRequest = NativeRequest, TResponse = NativeResponse, THeaders = unknown>(
  error: unknown,
): error is ResponseErrorOf<TResponses, TRequest, TResponse, THeaders> {
  return ResponseError.is(error)
}
