/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { DeletePetRequestConfig, DeletePetResponses } from './DeletePet'
import { client } from './.kubb/client'

/**
 * {@link /pet/:petId}
 */
export function deletePet<ThrowOnError extends boolean = true>(
  options: Options<DeletePetRequestConfig, ThrowOnError>,
): Promise<RequestResult<DeletePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'DELETE', url: '/pet/{petId}', meta: { operationId: 'deletePet', schemaPath: '/pet/{petId}' }, ...config }) as Promise<
    RequestResult<DeletePetResponses, ThrowOnError>
  >
}
