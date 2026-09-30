/**
 * A minimal client skeleton for `@kubb/plugin-client`.
 *
 * Kubb generates the typed operations and imports the names below from this file (`importPath`).
 * Everything else is yours: swap `fetch` for your own transport, then add auth, retries,
 * interceptors, validation, or serializers where you need them.
 */

export type SuccessOf<TResponses> = TResponses[Extract<keyof TResponses, '200' | '201' | '202' | '204'>]

/** Operations with several content types describe a body as `{ contentType, data }`. This keeps just the data. */
type DataOf<T> = T extends { contentType: string; data: infer TData } ? TData : T

type DataShape = { body?: unknown; headers?: unknown; path?: unknown; query?: unknown }

type ErrorBody = NonNullable<unknown>

/** The request a generated operation hands to `client`. */
export type RequestConfig = {
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  url: string
  baseURL?: string
  headers?: object
  path?: object
  query?: object
  body?: unknown
  /** Serialization hints for query and header values, generated for reference. This skeleton ignores them. */
  styles?: unknown
  signal?: AbortSignal
  throwOnError?: boolean
  /** The security schemes of the operation. Generated for reference. This skeleton ignores them, use them to add auth. */
  security?: Array<{ type: string; name?: string; in?: string }>
  client?: typeof client
}

/** The grouped options object each generated operation accepts. */
export type Options<TData extends DataShape, ThrowOnError extends boolean = true> = Omit<RequestConfig, keyof DataShape | 'url' | 'method'> &
  TData & { throwOnError?: ThrowOnError }

/** Every operation returns this shape. Extend it with the fields your app needs (status, headers, ...). */
export type RequestResult<TResponses, ThrowOnError extends boolean = true> = ThrowOnError extends true
  ? { data: DataOf<SuccessOf<TResponses>>; error: undefined; response: Response }
  : { data: DataOf<SuccessOf<TResponses>>; error: undefined; response: Response } | { data: undefined; error: ErrorBody; response: Response }

export type EventStreamResult<TData = unknown> = { stream: AsyncGenerator<TData>; response: Response }

export class ResponseError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Request failed with status ${status}`)
  }
}

let baseURL = ''

export function setBaseURL(url: string) {
  baseURL = url
}

/** The default transport: a plain `fetch` call. Replace this function to change how requests are sent. */
export async function client(config: RequestConfig): Promise<{ data: unknown; error: unknown; response: Response }> {
  const path: Record<string, unknown> = { ...config.path }
  const url = new URL((config.baseURL ?? baseURL) + config.url.replace(/\{(\w+)\}/g, (_, key) => encodeURIComponent(String(path[key]))))
  for (const [key, value] of Object.entries(config.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const response = await fetch(url, {
    method: config.method,
    headers: { ...(config.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(config.headers as Record<string, string>) },
    body: config.body === undefined ? undefined : JSON.stringify(config.body, (_, value) => (typeof value === 'bigint' ? value.toString() : value)),
    signal: config.signal,
  })

  const text = await response.text()
  const body = text ? JSON.parse(text) : undefined

  if (response.ok) return { data: body, error: undefined, response }
  if (config.throwOnError ?? true) throw new ResponseError(response.status, body)
  return { data: undefined, error: body, response }
}

/** Backs server-sent event operations. This skeleton does not parse streams, so it throws. Implement it if you use SSE. */
export async function toEventStream<TData = unknown>(_result: Promise<{ data: unknown; response: Response }>): Promise<EventStreamResult<TData>> {
  throw new Error('toEventStream is not implemented in this client')
}
