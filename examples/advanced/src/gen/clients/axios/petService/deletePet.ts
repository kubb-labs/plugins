import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { DeletePetRequestConfig, DeletePetResponses } from '../../../models/ts/pet/DeletePet.ts'
import { client } from '../../../.kubb/client.ts'
import { deletePetResponseSchema, deletePetErrorSchema } from '../../../zod/pet/deletePetSchema.ts'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export function deletePet<ThrowOnError extends boolean = true>(
  options: Options<DeletePetRequestConfig, ThrowOnError>,
): Promise<RequestResult<DeletePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'DELETE',
    url: '/pet/{petId}:search',
    security: [{ type: 'oauth2' }],
    parser: { response: (data: unknown) => deletePetResponseSchema.parse(data), error: (data: unknown) => deletePetErrorSchema.parse(data) },
    ...config,
  }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>
}
