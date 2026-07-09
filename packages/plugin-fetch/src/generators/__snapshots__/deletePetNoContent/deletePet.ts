/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client.ts'
import type { DeletePetOptions, DeletePetResponses } from './DeletePet.ts'
import { client } from './.kubb/client.ts'

/**
 * {@link /pet/:petId}
 */
export function deletePet<ThrowOnError extends boolean = true>(
  options: Options<DeletePetOptions, ThrowOnError>,
): Promise<RequestResult<DeletePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'DELETE', url: '/pet/{petId}', ...config }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>
}
