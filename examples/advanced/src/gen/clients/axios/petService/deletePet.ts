import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { DeletePetOptions, DeletePetResponses } from '../../../models/ts/pet/DeletePet'
import { client, withUnwrap } from '../../../.kubb/client'
import { deletePetResponseSchema, deletePetErrorSchema } from '../../../zod/pet/deletePetSchema'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export function deletePet<ThrowOnError extends boolean = true>(
  options: Options<DeletePetOptions, ThrowOnError>,
): Unwrappable<RequestResult<DeletePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'DELETE',
      url: '/pet/{petId}:search',
      security: [{ type: 'oauth2' }],
      validator: { response: deletePetResponseSchema, error: deletePetErrorSchema },
      ...config,
    }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>,
  )
}
