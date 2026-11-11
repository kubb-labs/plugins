import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import { client, withUnwrap, resolveThrowOnError, securitySchemes } from '../../../.kubb/client'
import { updatePetWithFormResponseSchema, updatePetWithFormStatus405Schema } from '../../../zod/pet/updatePetWithFormSchema'

/**
 * `POST /pet/{petId}:search`
 * @summary Updates a pet in the store with form data
 */
export function updatePetWithForm<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body?: never
      path: {
        petId: number
      }
      query?: {
        name?: string
        status?: string
      }
      headers?: never
    },
    ThrowOnError
  >,
): Unwrappable<
  RequestResult<
    {
      '405': unknown
    },
    ThrowOnError
  >
> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
      {
        '405': unknown
      },
      ThrowOnError
    >({
      method: 'POST',
      url: '/pet/{petId}:search',
      security: [{ ...securitySchemes.petstore_auth, scopes: ['write:pets', 'read:pets'] }],
      ...config,
      validator: { response: updatePetWithFormResponseSchema, error: { 405: updatePetWithFormStatus405Schema }, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
