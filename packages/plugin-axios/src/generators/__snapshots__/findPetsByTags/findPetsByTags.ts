/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { FindPetsByTagsOptions, FindPetsByTagsResponses } from './FindPetsByTags'
import { client, withUnwrap } from './.kubb/client'

/**
 * {@link /pet/findByTags}
 */
export function findPetsByTags<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByTagsOptions, ThrowOnError>,
): Unwrappable<RequestResult<FindPetsByTagsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(request({ method: 'GET', url: '/pet/findByTags', ...config }) as Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>>)
}
