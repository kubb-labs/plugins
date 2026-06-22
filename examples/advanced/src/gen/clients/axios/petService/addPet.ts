import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { AddPetRequestConfig, AddPetResponses } from '../../../models/ts/pet/AddPet.ts'
import { client } from '../../../.kubb/client.ts'
import { addPetResponseSchema } from '../../../zod/pet/addPetSchema.ts'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetRequestConfig, ThrowOnError>,
): Promise<RequestResult<AddPetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'POST',
    url: '/pet',
    security: [{ type: 'oauth2' }],
    parser: { response: (data: unknown) => addPetResponseSchema.parse(data) },
    ...config,
  }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>
}
