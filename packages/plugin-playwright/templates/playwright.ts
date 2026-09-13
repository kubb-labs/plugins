import type { APIRequestContext, APIResponse } from '@playwright/test'

type RequestOptions = {
  request: APIRequestContext
  method: string
  url: string
  baseURL?: string
  path?: Record<string, unknown>
  query?: Record<string, unknown>
  headers?: Record<string, unknown>
}

/**
 * Prepares OpenAPI parameters and returns the native Playwright response without reading its body.
 * Query arrays use repeated keys; null and undefined query and header values are omitted.
 */
export function playwrightRequest<T>(options: RequestOptions): Promise<APIResponse<T>> {
  const { request, method, url, baseURL, path, query, headers } = options
  const prefix = baseURL?.replace(/\/+$/, '') ?? ''
  const requestURL = prefix + url.replace(/\{([^}]+)\}/g, (_, key: string) => encodeURIComponent(String(path?.[key])))
  const fetchOptions: NonNullable<Parameters<APIRequestContext['fetch']>[1]> = { method }

  if ('query' in options) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query ?? {})) {
      for (const item of Array.isArray(value) ? value : [value]) {
        if (item != null) params.append(key, String(item))
      }
    }
    fetchOptions.params = params
  }

  if ('headers' in options) {
    fetchOptions.headers = Object.fromEntries(
      Object.entries(headers ?? {})
        .filter(([, value]) => value != null)
        .map(([key, value]) => [key, String(value)]),
    )
  }

  return request.fetch<T>(requestURL, fetchOptions)
}
