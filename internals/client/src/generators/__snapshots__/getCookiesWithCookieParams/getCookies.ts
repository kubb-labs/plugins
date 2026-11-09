/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetCookiesOptions, GetCookiesResponses } from './GetCookies'
import { client, withUnwrap } from './.kubb/client'

/**
 * {@link /cookies}
 */
export function getCookies<ThrowOnError extends boolean = true>(
  options: Options<GetCookiesOptions, ThrowOnError> = {},
): Unwrappable<RequestResult<GetCookiesResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'GET',
      url: '/cookies',
      styles: { cookie: { theme: { explode: false } } },
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<RequestResult<GetCookiesResponses, ThrowOnError>>,
  )
}
