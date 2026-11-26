/* eslint-disable no-alert, no-console */

import type { Options } from './.kubb/client'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { client, withUnwrap, resolveThrowOnError, securitySchemes } from './.kubb/client'

/**
 * `GET /pet/{petId}`
 */
export function getPetById<ThrowOnError extends boolean = true>(options: Options<GetPetByIdOptions, ThrowOnError>) {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<GetPetByIdResponses, ThrowOnError>({
      method: 'GET',
      url: '/pet/{petId}',
      security: [{ ...securitySchemes.petstore_auth, scopes: ['read:pets'] }, securitySchemes.api_key],
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
