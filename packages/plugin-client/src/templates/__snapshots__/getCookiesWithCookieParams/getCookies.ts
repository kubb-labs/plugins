/* eslint-disable no-alert, no-console */

import type { Options } from './.kubb/client'
import type { GetCookiesOptions, GetCookiesResponses } from './GetCookies'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `GET /cookies`
 */
export function getCookies<ThrowOnError extends boolean = true>(options: Options<GetCookiesOptions, ThrowOnError> = {}) {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<GetCookiesResponses, ThrowOnError>({
      method: 'GET',
      url: '/cookies',
      ...config,
      styles: { ...config.styles, cookie: { theme: { explode: false }, ...config.styles?.cookie } },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
