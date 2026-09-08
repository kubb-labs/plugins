import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { UpdatePetWithFormOptions, UpdatePetWithFormResponses } from '../../../models/ts/pet/UpdatePetWithForm'
import { client, withUnwrap } from '../../../.kubb/client'
import { updatePetWithFormResponseSchema, updatePetWithFormErrorSchema } from '../../../zod/pet/updatePetWithFormSchema'

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export function updatePetWithForm<ThrowOnError extends boolean = true>(
  options: Options<UpdatePetWithFormOptions, ThrowOnError>,
): Unwrappable<RequestResult<UpdatePetWithFormResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'POST',
      url: '/pet/{petId}:search',
      security: [{ type: 'oauth2' }],
      validator: { response: updatePetWithFormResponseSchema, error: updatePetWithFormErrorSchema },
      ...config,
    }) as Promise<RequestResult<UpdatePetWithFormResponses, ThrowOnError>>,
  )
}
