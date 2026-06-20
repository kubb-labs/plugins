/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsResponses } from './FindPetsByTags'
import { client } from './.kubb/client'

export function getFindPetsByTagsUrl() {
  const res = { method: 'GET', url: `/pet/findByTags` as const }

  return res
}

/**
 * {@link /pet/findByTags}
 */
export function findPetsByTags<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByTagsRequestConfig, ThrowOnError>,
): Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pet/findByTags', ...config }) as Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>>
}
