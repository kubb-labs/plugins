/* eslint-disable no-alert, no-console */

import type { FindPetsByTagsRequestConfig, FindPetsByTagsResponses } from './FindPetsByTags'
import type { Options, RequestResult } from '@kubb/plugin-client/clients/fetch'
import { client } from '@kubb/plugin-client/clients/fetch'

/**
 * {@link /pet/findByTags}
 */
export function findPetsByTags<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByTagsRequestConfig, ThrowOnError>,
): Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pet/findByTags', ...config }) as Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>>
}
