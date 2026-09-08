import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { UpdatePetOptions, UpdatePetResponses } from '../../../models/ts/pet/UpdatePet'
import { client, withUnwrap } from '../../../.kubb/client'
import { updatePetResponseSchema, updatePetErrorSchema } from '../../../zod/pet/updatePetSchema'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export function updatePet<ThrowOnError extends boolean = true>(
  options: Options<UpdatePetOptions, ThrowOnError>,
): Unwrappable<RequestResult<UpdatePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'PUT',
      url: '/pet',
      security: [{ type: 'oauth2' }],
      validator: { response: updatePetResponseSchema, error: updatePetErrorSchema },
      ...config,
    }) as Promise<RequestResult<UpdatePetResponses, ThrowOnError>>,
  )
}
