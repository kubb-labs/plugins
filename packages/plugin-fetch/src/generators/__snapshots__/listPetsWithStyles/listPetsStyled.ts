/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client.ts'
import type { ListPetsStyledOptions, ListPetsStyledResponses } from './ListPetsStyled.ts'
import { client } from './.kubb/client.ts'

/**
 * {@link /pets/:petId}
 */
export function listPetsStyled<ThrowOnError extends boolean = true>(
  options: Options<ListPetsStyledOptions, ThrowOnError>,
): Promise<RequestResult<ListPetsStyledResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'GET',
    url: '/pets/{petId}',
    styles: { path: { petId: { style: 'matrix', explode: true } }, query: { tags: { style: 'pipeDelimited', explode: false } } },
    ...config,
  }) as Promise<RequestResult<ListPetsStyledResponses, ThrowOnError>>
}
