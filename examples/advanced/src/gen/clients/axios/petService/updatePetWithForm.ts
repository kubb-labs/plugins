import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { UpdatePetWithFormRequestConfig, UpdatePetWithFormResponses } from '../../../models/ts/pet/UpdatePetWithForm.ts'
import { client } from '../../../.kubb/client.ts'
import { updatePetWithFormResponseSchema, updatePetWithFormErrorSchema } from '../../../zod/pet/updatePetWithFormSchema.ts'

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export function updatePetWithForm<ThrowOnError extends boolean = true>(
  options: Options<UpdatePetWithFormRequestConfig, ThrowOnError>,
): Promise<RequestResult<UpdatePetWithFormResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'POST',
    url: '/pet/{petId}:search',
    security: [{ type: 'oauth2' }],
    parser: { response: (data: unknown) => updatePetWithFormResponseSchema.parse(data), error: (data: unknown) => updatePetWithFormErrorSchema.parse(data) },
    meta: { operationId: 'updatePetWithForm', schemaPath: '/pet/{petId}:search' },
    ...config,
  }) as Promise<RequestResult<UpdatePetWithFormResponses, ThrowOnError>>
}
