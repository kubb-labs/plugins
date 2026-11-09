/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { ListPetsStyledOptions, ListPetsStyledResponses } from './ListPetsStyled'
import { client, withUnwrap } from './.kubb/client'

/**
 * `GET /pets/{petId}`
 * @param options - The request (`path`, `query`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
 */
export function listPetsStyled<ThrowOnError extends boolean = true>(
  options: Options<ListPetsStyledOptions, ThrowOnError>,
): Unwrappable<RequestResult<ListPetsStyledResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'GET',
      url: '/pets/{petId}',
      ...config,
      styles: {
        ...config.styles,
        path: { petId: { style: 'matrix', explode: true }, ...config.styles?.path },
        query: { tags: { style: 'pipeDelimited', explode: false }, ...config.styles?.query },
      },
      throwOnError: config.throwOnError ?? true,
    }) as Promise<RequestResult<ListPetsStyledResponses, ThrowOnError>>,
  )
}
