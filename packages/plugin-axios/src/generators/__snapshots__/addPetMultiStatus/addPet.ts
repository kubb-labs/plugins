/* eslint-disable no-alert, no-console */

import type { Options, Unwrappable, RequestResult } from './.kubb/client'
import type { AddPetOptions, AddPetResponses } from './AddPet'
import { client, withUnwrap } from './.kubb/client'

/**
 * {@link /pet}
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetOptions, ThrowOnError>,
): Unwrappable<RequestResult<AddPetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(request({ method: 'POST', url: '/pet', ...config })) as Unwrappable<RequestResult<AddPetResponses, ThrowOnError>>
}
