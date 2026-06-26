import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { UpdatePetRequestConfig, UpdatePetResponses } from '../../../models/ts/pet/UpdatePet.ts'
import { client } from '../../../.kubb/client.ts'
import { updatePetResponseSchema, updatePetErrorSchema } from '../../../zod/pet/updatePetSchema.ts'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export function updatePet<ThrowOnError extends boolean = true>(
  options: Options<UpdatePetRequestConfig, ThrowOnError>,
): Promise<RequestResult<UpdatePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'PUT',
    url: '/pet',
    security: [{ type: 'oauth2' }],
    parser: { response: (data: unknown) => updatePetResponseSchema.parse(data), error: (data: unknown) => updatePetErrorSchema.parse(data) },
    meta: { operationId: 'updatePet', schemaPath: '/pet' },
    ...config,
  }) as Promise<RequestResult<UpdatePetResponses, ThrowOnError>>
}
