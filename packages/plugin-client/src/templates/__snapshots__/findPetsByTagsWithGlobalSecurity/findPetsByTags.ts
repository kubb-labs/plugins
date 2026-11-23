/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { FindPetsByTagsOptions, FindPetsByTagsResponses } from './FindPetsByTags'
import { client, withUnwrap, resolveThrowOnError, securitySchemes } from './.kubb/client'

/**
 * `GET /pet/findByTags`
 */
export function findPetsByTags<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByTagsOptions, ThrowOnError>,
): Unwrappable<RequestResult<FindPetsByTagsResponses, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<FindPetsByTagsResponses, ThrowOnError>({
      method: 'GET',
      url: '/pet/findByTags',
      security: [securitySchemes.bearerAuth],
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
