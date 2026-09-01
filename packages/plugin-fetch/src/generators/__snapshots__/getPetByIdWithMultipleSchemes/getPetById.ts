/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { client, withUnwrap } from './.kubb/client'

/**
 * {@link /pet/:petId}
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdOptions, ThrowOnError>,
): Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({ method: 'GET', url: '/pet/{petId}', security: [{ type: 'oauth2' }, { type: 'apiKey', name: 'api_key', in: 'header' }], ...config }),
  ) as Unwrappable<RequestResult<GetPetByIdResponses, ThrowOnError>>
}
