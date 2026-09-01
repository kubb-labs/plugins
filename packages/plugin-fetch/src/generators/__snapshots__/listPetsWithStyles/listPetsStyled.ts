/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { ListPetsStyledOptions, ListPetsStyledResponses } from './ListPetsStyled'
import { client, withUnwrap } from './.kubb/client'

/**
 * {@link /pets/:petId}
 */
export function listPetsStyled<ThrowOnError extends boolean = true>(
  options: Options<ListPetsStyledOptions, ThrowOnError>,
): Unwrappable<RequestResult<ListPetsStyledResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'GET',
      url: '/pets/{petId}',
      styles: { path: { petId: { style: 'matrix', explode: true } }, query: { tags: { style: 'pipeDelimited', explode: false } } },
      ...config,
    }),
  ) as Unwrappable<RequestResult<ListPetsStyledResponses, ThrowOnError>>
}
