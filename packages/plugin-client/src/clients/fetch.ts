/**
 * RequestCredentials
 */
export type RequestCredentials = 'omit' | 'same-origin' | 'include'

/**
 * Header values may be objects (e.g. JSON-encoded filter headers like `X-Filter`).
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
 * Objects (including arrays) are JSON-stringified so spec-defined object
 * headers like `X-Filter` are sent in their canonical JSON-string form.
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

export type ResponseErrorConfig<TError = unknown> = TError

export type Client = <TResponseData, _TError = unknown, TRequestData = unknown>(
  config: RequestConfig<TRequestData>,
  request?: unknown,
) => Promise<ResponseConfig<TResponseData>>

export const client = async <TResponseData, _TError = unknown, RequestData = unknown>(
  paramsConfig: RequestConfig<RequestData>,
  _request?: unknown,
): Promise<ResponseConfig<TResponseData>> => {
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

  const response = await globalThis.fetch(targetUrl, {
    credentials: config.credentials || 'same-origin',
    method: config.method?.toUpperCase(),
    body: config.data instanceof FormData ? config.data : JSON.stringify(config.data),
    signal: config.signal,
    headers: {
      ...(config.contentType && config.contentType !== 'multipart/form-data' ? { 'Content-Type': config.contentType } : {}),
      ...serializeHeaders(config.headers),
    },
  })

  const data = [204, 205, 304].includes(response.status) || !response.body ? {} : await response.json()

  return {
    data: data as TResponseData,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Headers,
  }
}

client.getConfig = getConfig
client.setConfig = setConfig

export default client
