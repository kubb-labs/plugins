/* eslint-disable no-alert, no-console */

import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import type { Options, Unwrappable, RequestResult } from '@acme/api-client'
import { client, withUnwrap, resolveThrowOnError } from '@acme/api-client'

/**
 * `GET /pet/{petId}`
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdOptions, ThrowOnError>,
): Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<GetPetByIdResponses, ThrowOnError>({
      method: 'GET',
      url: '/pet/{petId}',
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
