import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

declare const AXIOS_BASE: string
declare const AXIOS_HEADERS: string

/**
 * Header values may be objects (e.g. JSON-encoded headers like `X-Filter` in the Linode API).
 * Non-string values are JSON-serialized before the request is sent.
 */
export type HeaderValue = string | number | boolean | null | undefined | object
export type HeadersInit = Array<[string, HeaderValue]> | Record<string, HeaderValue>

/**
 * Subset of AxiosRequestConfig
 */
export type RequestConfig<TData = unknown> = {
  baseURL?: string
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
  query?: unknown
  body?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  validateStatus?: (status: number) => boolean
  headers?: HeadersInit
  contentType?: string
}

/**
 * Subset of AxiosResponse
 */
export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers: AxiosResponse['headers']
}

export type ResponseErrorConfig<TError = unknown> = AxiosError<TError>

export type Client = <TData, _TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>, request?: unknown) => Promise<ResponseConfig<TData>>

let _config: Partial<RequestConfig> = {
  baseURL: typeof AXIOS_BASE !== 'undefined' ? AXIOS_BASE : undefined,
  headers: typeof AXIOS_HEADERS !== 'undefined' ? JSON.parse(AXIOS_HEADERS) : undefined,
}

export const getConfig = () => _config

export const setConfig = (config: RequestConfig) => {
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
 * Serializes header values into the string form `axios` ultimately puts on the wire.
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

export const axiosInstance = axios.create(getConfig() as AxiosRequestConfig)

export const client = async <TData, TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>,
  _request?: unknown,
): Promise<ResponseConfig<TData>> => {
  const requestConfig = mergeConfig(getConfig(), config)
  const { contentType, headers, query, body, ...axiosConfig } = requestConfig
  return axiosInstance
    .request<TData, ResponseConfig<TData>>({
      ...axiosConfig,
      params: query,
      data: body,
      headers: {
        ...(contentType && contentType !== 'multipart/form-data' ? { 'Content-Type': contentType } : {}),
        ...serializeHeaders(headers),
      },
    })
    .catch((e: AxiosError<TError>) => {
      throw e
    })
}

client.getConfig = getConfig
client.setConfig = setConfig