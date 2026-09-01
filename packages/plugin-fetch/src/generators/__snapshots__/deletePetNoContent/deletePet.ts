/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet'
import { client, withUnwrap } from './.kubb/client'

/**
 * {@link /pet/:petId}
 */
export function deletePet<ThrowOnError extends boolean = true>(
  options: Options<DeletePetOptions, ThrowOnError>,
): Unwrappable<RequestResult<DeletePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(request({ method: 'DELETE', url: '/pet/{petId}', ...config })) as Unwrappable<RequestResult<DeletePetResponses, ThrowOnError>>
}
