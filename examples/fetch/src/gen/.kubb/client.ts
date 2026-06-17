/**
 * RequestCredentials
 */
export type RequestCredentials = 'omit' | 'same-origin' | 'include'

/**
 * Header values may be objects (e.g. JSON-encoded headers like `X-Filter` in the Linode API).
 * Non-string values are JSON-serialized before the request is sent.
 */
export type HeaderValue = string | number | boolean | null | undefined | object
export type HeadersInit = Array<[string, HeaderValue]> | Record<string, HeaderValue>

/**
 * Subset of FetchRequestConfig
 */
export type RequestConfig<TData = unknown> = {
  baseURL?: string
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  params?: unknown
  data?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: HeadersInit
  credentials?: RequestCredentials
  contentType?: string
}

/**
 * Subset of FetchResponse
 */
export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers: Headers
}

let _config: Partial<RequestConfig> = {}

export const getConfig = () => _config

export const setConfig = (config: Partial<RequestConfig>) => {
  _config = config
  return getConfig()
}

export const mergeConfig = <T extends RequestConfig>(...configs: Array<Partial<T>>): Partial<T> => {
  return configs.reduce<Partial<T>>((merged, config) => {
    return {
      ...merged,
      ...config,
      headers: {
        ...(Array.isArray(merged.headers) ? Object.fromEntries(merged.headers) : merged.headers),
        ...(Array.isArray(config.headers) ? Object.fromEntries(config.headers) : config.headers),
      },
    }
  }, {})
}

/**
 * Serializes header values into the string form `fetch` expects.
 * Objects (including arrays) are JSON-stringified so spec-defined object headers like `X-Filter`
 * are sent in their canonical JSON-string form rather than `[object Object]`.
 */
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

/**
 * Serializes the request body into the form `fetch` expects.
 * `FormData`, `URLSearchParams`, `Blob`, `ArrayBuffer` and string bodies are passed through
 * untouched. Plain objects are encoded as `URLSearchParams` for `application/x-www-form-urlencoded`
 * and JSON-serialized otherwise.
 */
function serializeBody(data: unknown, contentType?: string): BodyInit | undefined {
  if (data === undefined || data === null) return undefined
  if (data instanceof FormData || data instanceof URLSearchParams || data instanceof Blob || data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    return data as BodyInit
  }
  if (typeof data === 'string') return data
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    return new URLSearchParams(data as Record<string, string>)
  }
  return JSON.stringify(data)
}

/**
 * Picks a `responseType` from a `Content-Type` header, or `undefined` when it is not recognized.
 */
function detectResponseType(contentType: string | null): RequestConfig['responseType'] {
  if (!contentType) return undefined
  if (contentType.includes('application/json') || contentType.includes('text/json')) return 'json'
  if (contentType.includes('text/')) return 'text'
  if (contentType.includes('image/') || contentType.includes('application/octet-stream')) return 'blob'
  return undefined
}

/**
 * Parses a `fetch` response body.
 *
 * - Empty responses (204/205/304 or no body) resolve to `{}`.
 * - An explicit `responseType` (or one detected from the `Content-Type` header) forces the matching
 *   `Response` method.
 * - As a last resort the body is read as text and `JSON.parse`d, falling back to the raw text.
 */
async function parseResponse<TData>(response: Response, responseType?: RequestConfig['responseType']): Promise<TData> {
  if ([204, 205, 304].includes(response.status) || !response.body) {
    return {} as TData
  }

  switch (responseType ?? detectResponseType(response.headers.get('Content-Type'))) {
    case 'text':
    case 'document':
      return (await response.text()) as TData
    case 'blob':
      return (await response.blob()) as TData
    case 'arraybuffer':
      return (await response.arrayBuffer()) as TData
    case 'stream':
      return response.body as TData
    case 'json':
      return (await response.json()) as TData
  }

  // Explicit but unrecognized responseType keeps the JSON default; otherwise read text and parse it.
  if (responseType) {
    return (await response.json()) as TData
  }
  const text = await response.text()
  if (!text) {
    return {} as TData
  }
  try {
    return JSON.parse(text) as TData
  } catch {
    return text as TData
  }
}

export type ResponseErrorConfig<TError = unknown> = TError

export type Client = <TData, _TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>, request?: unknown) => Promise<ResponseConfig<TData>>

export const client = async <TData, _TError = unknown, TVariables = unknown>(
  paramsConfig: RequestConfig<TVariables>,
  _request?: unknown,
): Promise<ResponseConfig<TData>> => {
  const normalizedParams = new URLSearchParams()

  const config = mergeConfig(getConfig(), paramsConfig)

  Object.entries(config.params || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString())
    }
  })

  let targetUrl = [config.baseURL, config.url].filter(Boolean).join('')

  if (config.params) {
    targetUrl += `?${normalizedParams}`
  }

  const headers: Record<string, string> = {
    ...(config.contentType && config.contentType !== 'multipart/form-data' ? { 'Content-Type': config.contentType } : {}),
    ...serializeHeaders(config.headers),
  }

  const response = await globalThis.fetch(targetUrl, {
    credentials: config.credentials || 'same-origin',
    method: config.method?.toUpperCase(),
    body: serializeBody(config.data, headers['Content-Type'] ?? headers['content-type']),
    signal: config.signal,
    headers,
  })

  const data = await parseResponse<TData>(response, config.responseType)

  return {
    data,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Headers,
  }
}

client.getConfig = getConfig
client.setConfig = setConfig
