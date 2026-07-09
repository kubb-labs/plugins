/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client.ts'
import type { FindPetsByTagsOptions, FindPetsByTagsResponses } from './FindPetsByTags.ts'
import { client } from './.kubb/client.ts'

/**
 * {@link /pet/findByTags}
 */
export function findPetsByTags<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByTagsOptions, ThrowOnError>,
): Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pet/findByTags', ...config }) as Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>>
}
