/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { ListPetsStyledOptions, ListPetsStyledResponses } from './ListPetsStyled'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `GET /pets/{petId}`
 */
export function listPetsStyled<ThrowOnError extends boolean = true>(
  options: Options<ListPetsStyledOptions, ThrowOnError>,
): Unwrappable<RequestResult<ListPetsStyledResponses, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<ListPetsStyledResponses, ThrowOnError>({
      method: 'GET',
      url: '/pets/{petId}',
      ...config,
      styles: {
        ...config.styles,
        path: { petId: { style: 'matrix', explode: true }, ...config.styles?.path },
        query: { tags: { style: 'pipeDelimited', explode: false }, ...config.styles?.query },
      },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
