/**
 * A minimal client skeleton for `@kubb/plugin-client`.
 *
 * Kubb generates the typed operations and imports the names below from this file (`importPath`).
 * Everything else is yours: swap `fetch` for your own transport, then add auth, retries,
 * interceptors, validation, or serializers where you need them.
 */

/**
 * The success body of a responses record, picked by status code.
 */
export type SuccessOf<TResponses> = TResponses[Extract<keyof TResponses, '200' | '201' | '202' | '204'>]

/**
 * Operations with several content types describe a body as `{ contentType, data }`. This keeps just the data.
 */
type DataOf<T> = T extends { contentType: string; data: infer TData } ? TData : T

type DataShape = { body?: unknown; cookies?: unknown; headers?: unknown; path?: unknown; query?: unknown }

type ErrorBody = NonNullable<unknown>

/**
 * One security scheme of an operation. A nested array in `security` lists schemes that are all needed together.
 */
export type Auth = {
  type: string
  scheme?: string
  name?: string
  in?: string
  scopes?: Array<string>
  flows?: Record<string, Record<string, string>>
  metadataUrl?: string
  url?: string
}

/**
 * The request a generated operation hands to `client`.
 */
export type RequestConfig = {
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  url: string
  baseURL?: string
  headers?: object
  path?: object
  query?: object
  cookies?: object
  body?: unknown
  /**
   * Media type hints from the operation. This skeleton assumes JSON.
   */
  contentType?: string | { request?: string; response?: string }
  /**
   * Serialization hints for query and header values, generated for reference. This skeleton ignores them.
   */
  styles?: unknown
  /**
   * How to read a success body, set for binary downloads (`'blob'`). This skeleton reads JSON.
   */
  parseAs?: 'json' | 'text' | 'blob' | 'arrayBuffer' | 'stream'
  /**
   * What a Server-Sent Events call's validator checks per event. Generated for reference on stream calls.
   */
  eventShape?: 'event' | 'data'
  signal?: AbortSignal
  throwOnError?: boolean
  /**
   * The security schemes of the operation. Generated for reference. This skeleton ignores them, use them to add auth.
   */
  security?: Array<Auth | Array<Auth>>
  client?: typeof client
}

/**
 * The grouped options object each generated operation accepts.
 */
export type Options<TData extends DataShape, ThrowOnError extends boolean = true> = Omit<RequestConfig, keyof DataShape | 'url' | 'method'> &
  TData & { throwOnError?: ThrowOnError }

/**
 * Every operation returns this shape. Extend it with the fields your app needs (status, headers, ...).
 */
export type RequestResult<TResponses, ThrowOnError extends boolean = true> = ThrowOnError extends true
  ? { data: DataOf<SuccessOf<TResponses>>; error: undefined; response: Response }
  : { data: DataOf<SuccessOf<TResponses>>; error: undefined; response: Response } | { data: undefined; error: ErrorBody; response: Response }

/**
 * One event of a payload-only stream: the payload as `data`, under the event name the server sent.
 */
export type ServerSentEvent<TData = unknown> = { data: TData; event: string; id?: string; retry?: number }

/**
 * An event typed by name, for a stream whose document types each event with its own `event` and `data`.
 */
export type TypedEvent<TEvent> = TEvent & { id?: string; retry?: number }

/**
 * What `client.stream` resolves to: the parsed events and the native response. `TEvent` is the full event type.
 */
export type StreamResult<TResponses, _ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>> = {
  stream: AsyncGenerator<TEvent>
  response: Response
}

/**
 * What a failed query hook rejects with. Only the query plugins import it.
 */
export type ResponseErrorConfig<TError = unknown> = ResponseError & { body: TError }

/**
 * Thrown by `client` for a non-2xx status when `throwOnError` is true.
 */
export class ResponseError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Request failed with status ${status}`)
  }
}

let baseURL = ''

type GetToken = () => Promise<string | undefined>

let getToken: GetToken | undefined

/**
 * Sets the API host that `client` prepends to every request.
 */
export function setBaseURL(url: string) {
  baseURL = url
}

/**
 * Registers an async credential source. It runs before each request that the spec marks as secured,
 * so it can read a secrets store or refresh an expired token. Replace it with signing or any other scheme.
 */
export function setAuth(resolve: GetToken) {
  getToken = resolve
}

/**
 * The default transport: a plain `fetch` call. Replace this function to change how requests are sent.
 */
async function send(config: RequestConfig): Promise<{ data: unknown; error: unknown; response: Response }> {
  const path: Record<string, unknown> = { ...config.path }
  const url = new URL((config.baseURL ?? baseURL) + config.url.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(String(path[key]))))
  for (const [key, value] of Object.entries(config.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const token = config.security?.length ? await getToken?.() : undefined
  const cookie = Object.entries(config.cookies ?? {})
    .filter(([, value]) => value != null)
    .map(([name, value]) => `${name}=${encodeURIComponent(String(value))}`)
    .join('; ')

  const response = await fetch(url, {
    method: config.method,
    headers: {
      ...(config.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(config.headers as Record<string, string>),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: config.body === undefined ? undefined : JSON.stringify(config.body, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    signal: config.signal,
  })

  const text = await response.text()
  const body = text ? JSON.parse(text) : undefined

  if (response.ok) return { data: body, error: undefined, response }
  if (config.throwOnError ?? true) throw new ResponseError(response.status, body)
  return { data: undefined, error: body, response }
}

/**
 * What every generated operation calls. Each operation passes its responses record and `ThrowOnError` as type
 * arguments, so the result is typed per operation. `stream` backs server-sent event operations; this skeleton does
 * not parse streams, so it throws. Implement it if you use SSE.
 */
export function client<TResponses, ThrowOnError extends boolean = true>(config: RequestConfig): Promise<RequestResult<TResponses, ThrowOnError>> {
  // The skeleton trusts the server to answer with the documented body; validate here if you need to.
  return send(config) as Promise<RequestResult<TResponses, ThrowOnError>>
}

client.stream = async <TResponses, ThrowOnError extends boolean = true, TEvent = ServerSentEvent<SuccessOf<TResponses>>>(
  _config: RequestConfig,
): Promise<StreamResult<TResponses, ThrowOnError, TEvent>> => {
  throw new Error('client.stream is not implemented in this client')
}
