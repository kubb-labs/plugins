import type { Options, RequestResult } from '../../../.kubb/client'
import type { DeletePetOptions, DeletePetResponses } from '../../../models/ts/pet/DeletePet'
import { client } from '../../../.kubb/client'
import { deletePetResponseSchema, deletePetErrorSchema } from '../../../zod/pet/deletePetSchema'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export function deletePet<ThrowOnError extends boolean = true>(
  options: Options<DeletePetOptions, ThrowOnError>,
): Promise<RequestResult<DeletePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'DELETE',
    url: '/pet/{petId}:search',
    security: [{ type: 'oauth2' }],
    validator: { response: deletePetResponseSchema, error: deletePetErrorSchema },
    ...config,
    headers: config.headers ? { api_key: config.headers.apiKey } : config.headers,
  }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>
}
