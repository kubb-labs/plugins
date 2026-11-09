/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetCookiesOptions, GetCookiesResponses } from './GetCookies'
import { client, withUnwrap } from './.kubb/client'

/**
 * `GET /cookies`
 * @param options - The request (`cookies`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
 */
export function getCookies<ThrowOnError extends boolean = true>(
  options: Options<GetCookiesOptions, ThrowOnError> = {},
): Unwrappable<RequestResult<GetCookiesResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'GET',
      url: '/cookies',
      ...config,
      styles: { ...config.styles, cookie: { theme: { explode: false }, ...config.styles?.cookie } },
      throwOnError: config.throwOnError ?? true,
    }) as Promise<RequestResult<GetCookiesResponses, ThrowOnError>>,
  )
}
