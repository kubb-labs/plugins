import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { DeletePetRequestConfig, DeletePetResponses } from '../../../models/ts/pet/DeletePet.ts'
import { client } from '../../../.kubb/client.ts'
import { deletePetResponseSchema } from '../../../zod/pet/deletePetSchema.ts'

export function getDeletePetUrl(path: DeletePetRequestConfig['path']) {
  const res = { method: 'DELETE', url: `https://petstore3.swagger.io/api/v3/pet/${path.petId}:search` as const }

  return res
}

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
    parser: { response: (data: unknown) => deletePetResponseSchema.parse(data) },
    ...config,
  }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>
}
