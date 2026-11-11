import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import { client, withUnwrap, resolveThrowOnError, securitySchemes } from '../../../.kubb/client'
import { deletePetResponseSchema, deletePetStatus400Schema } from '../../../zod/pet/deletePetSchema'

/**
 * `DELETE /pet/{petId}:search`
 * @description delete a pet
 * @summary Deletes a pet
 */
export function deletePet<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body?: never
      path: {
        petId: number
      }
      query?: never
      headers?: {
        api_key?: string
      }
    },
    ThrowOnError
  >,
): Unwrappable<
  RequestResult<
    {
      '400': unknown
    },
    ThrowOnError
  >
> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
      {
        '400': unknown
      },
      ThrowOnError
    >({
      method: 'DELETE',
      url: '/pet/{petId}:search',
      security: [{ ...securitySchemes.petstore_auth, scopes: ['write:pets', 'read:pets'] }],
      ...config,
      validator: { response: deletePetResponseSchema, error: { 400: deletePetStatus400Schema }, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
