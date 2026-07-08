/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet'
import { client } from './.kubb/client'

/**
 * {@link /pet/:petId}
 */
export function deletePet<ThrowOnError extends boolean = true>(
  options: Options<DeletePetOptions, ThrowOnError>,
): Promise<RequestResult<DeletePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'DELETE', url: '/pet/{petId}', ...config }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>
}
