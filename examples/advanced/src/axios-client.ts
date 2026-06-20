import type { AxiosError, AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

declare const AXIOS_BASE: string
declare const AXIOS_HEADERS: string

/**
 * Subset of AxiosRequestConfig
 */
export type RequestConfig<TData = unknown> = {
  baseURL?: string
  url?: string
  method: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'
  query?: unknown
  body?: TData | FormData
  responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
  signal?: AbortSignal
  headers?: AxiosRequestConfig['headers']
  contentType?: string
}
/**
 * Subset of AxiosResponse
 */
export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers?: AxiosResponse['headers']
}

export type ResponseErrorConfig<TError = unknown> = TError

export const axiosInstance = axios.create({
  baseURL: typeof AXIOS_BASE !== 'undefined' ? AXIOS_BASE : undefined,
  headers: typeof AXIOS_HEADERS !== 'undefined' ? (JSON.parse(AXIOS_HEADERS) as AxiosHeaders) : undefined,
})

export type Client = <TData, _TError = unknown, TVariables = unknown>(config: RequestConfig<TVariables>, request?: unknown) => Promise<ResponseConfig<TData>>

export const client = async <TData, TError = unknown, TVariables = unknown>(
  config: RequestConfig<TVariables>,
  _request?: unknown,
): Promise<ResponseConfig<TData>> => {
  const { contentType, headers, query, body, ...axiosConfig } = config
  const promise = axiosInstance
    .request<TVariables, ResponseConfig<TData>>({
      ...axiosConfig,
      params: query,
      data: body,
      headers: {
        ...(contentType && contentType !== 'multipart/form-data' ? { 'Content-Type': contentType } : {}),
        ...headers,
      },
    })
    .catch((e: AxiosError<TError>) => {
      throw e
    })

  return promise
}

export default client
