/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { FindPetsByTagsOptions, FindPetsByTagsResponses } from './FindPetsByTags'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

/**
 * `GET /pet/findByTags`
 * @param options - The request (`query`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
 */
export function findPetsByTags<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByTagsOptions, ThrowOnError>,
): Unwrappable<RequestResult<FindPetsByTagsResponses, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<FindPetsByTagsResponses, ThrowOnError>({
      method: 'GET',
      url: '/pet/findByTags',
      security: [{ type: 'http', scheme: 'bearer' }],
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
