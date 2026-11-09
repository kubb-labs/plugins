/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { client, withUnwrap, resolveThrowOnError } from './.kubb/client'

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
      security: [
        { type: 'oauth2', scopes: ['read:pets'] },
        { type: 'apiKey', name: 'api_key', in: 'header' },
      ],
      ...config,
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
