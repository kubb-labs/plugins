/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { AddPetOptions, AddPetResponses } from './AddPet'
import { client, withUnwrap, resolveThrowOnError, securitySchemes } from './.kubb/client'

/**
 * `POST /pet`
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetOptions, ThrowOnError>,
): Unwrappable<RequestResult<AddPetResponses, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<AddPetResponses, ThrowOnError>({
      method: 'POST',
      url: '/pet',
      security: [{ ...securitySchemes.petstore_auth, scopes: ['write:pets', 'read:pets'] }],
      contentType: { request: 'application/json' },
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
