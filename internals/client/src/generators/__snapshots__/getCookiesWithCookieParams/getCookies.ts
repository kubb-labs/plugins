/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetCookiesOptions, GetCookiesResponses } from './GetCookies'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * {@link /cookies}
 */
export function getCookies<ThrowOnError extends boolean = true>(
  options: Options<GetCookiesOptions, ThrowOnError> = {},
): Unwrappable<RequestResult<GetCookiesResponses, ThrowOnError>> {
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
