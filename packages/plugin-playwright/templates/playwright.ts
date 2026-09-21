import type { APIRequestContext, APIResponse } from '@playwright/test'

/**
 * Native Playwright fetch options. The operation fixes the HTTP method.
 */
export type RequestConfig = Omit<NonNullable<Parameters<APIRequestContext['fetch']>[1]>, 'method'>

type RequestOptions = {
  request: APIRequestContext
  method: string
  url: string
  baseURL?: string
  path?: Record<string, unknown>
  query?: Record<string, unknown>
  headers?: Record<string, unknown>
  body?: unknown
  contentType?: string
  config?: RequestConfig
}

/**
 * Prepares OpenAPI parameters and returns the native Playwright response without reading its body.
 * Query arrays use repeated keys; null and undefined query and header values are omitted.
 */
export function playwrightRequest<T>(options: RequestOptions): Promise<APIResponse<T>> {
  const { request, method, url, baseURL, path, query, headers, body, contentType, config } = options
  const prefix = baseURL?.replace(/\/+$/, '') ?? ''
  const requestURL = prefix + url.replace(/\{([^}]+)\}/g, (_, key: string) => encodeURIComponent(String(path?.[key])))
  const fetchOptions: NonNullable<Parameters<APIRequestContext['fetch']>[1]> = {
    ...Object.fromEntries(Object.entries(config ?? {}).filter(([, value]) => value !== undefined)),
    method,
  }

  if ('query' in options && config?.params === undefined) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query ?? {})) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item != null) params.append(key, String(item))
      }
    }
    fetchOptions.params = params
  }

  if ('headers' in options && config?.headers === undefined) {
    fetchOptions.headers = Object.fromEntries(
      Object.entries(headers ?? {})
        .filter(([, value]) => value != null)
        .map(([key, value]) => [key, String(value)]),
    )
  }

  const hasNativeBody = config?.data !== undefined || config?.form !== undefined || config?.multipart !== undefined
  if (body !== undefined && !hasNativeBody) {
    fetchOptions.data = JSON.stringify(body)
    if (!Object.keys(fetchOptions.headers ?? {}).some((key) => key.toLowerCase() === 'content-type')) {
      fetchOptions.headers = { ...fetchOptions.headers, 'Content-Type': contentType ?? 'application/json' }
    }
  }

  return request.fetch<T>(requestURL, fetchOptions)
}
