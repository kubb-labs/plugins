/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { ListPetsStyledRequestConfig, ListPetsStyledResponses } from './ListPetsStyled'
import { client } from './.kubb/client'

/**
 * {@link /pets/:petId}
 */
export function listPetsStyled<ThrowOnError extends boolean = true>(
  options: Options<ListPetsStyledRequestConfig, ThrowOnError>,
): Promise<RequestResult<ListPetsStyledResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'GET',
    url: '/pets/{petId}',
    serialization: { path: { petId: { style: 'matrix', explode: true } }, query: { tags: { style: 'pipeDelimited', explode: false } } },
    ...config,
  }) as Promise<RequestResult<ListPetsStyledResponses, ThrowOnError>>
}
