/* eslint-disable no-alert, no-console */

import type { Options, UnwrappedResult } from './.kubb/client'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import { client, unwrapResult } from './.kubb/client'

/**
 * {@link /pet/:petId}
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdOptions, ThrowOnError>,
): Promise<UnwrappedResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return unwrapResult(request({ method: 'GET', url: '/pet/{petId}', ...config }), config.throwOnError) as Promise<
    UnwrappedResult<GetPetByIdResponses, ThrowOnError>
  >
}
