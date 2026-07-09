import type { Options, RequestResult } from '../../../.kubb/client'
import type { AddPetOptions, AddPetResponses } from '../../../models/ts/pet/AddPet'
import { client } from '../../../.kubb/client'
import { addPetResponseSchema, addPetErrorSchema } from '../../../zod/pet/addPetSchema'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetOptions, ThrowOnError>,
): Promise<RequestResult<AddPetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'POST',
    url: '/pet',
    security: [{ type: 'oauth2' }],
    validator: { response: addPetResponseSchema, error: addPetErrorSchema },
    ...config,
  }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>
}
