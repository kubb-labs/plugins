/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsResponses } from './FindPetsByTags'
import { client } from './.kubb/client'

export type FindPetsByTagsRequest = {
  body?: FindPetsByTagsRequestConfig['data']
  path?: FindPetsByTagsRequestConfig['pathParams']
  query?: FindPetsByTagsRequestConfig['queryParams']
  headers?: FindPetsByTagsRequestConfig['headerParams']
  url: FindPetsByTagsRequestConfig['url']
}

/**
 * {@link /pet/findByTags}
 */
export function findPetsByTags<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByTagsRequest, ThrowOnError>,
): Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pet/findByTags', ...config }) as Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>>
}
