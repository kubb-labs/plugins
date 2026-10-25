import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import { client, withUnwrap } from '../../../.kubb/client'
import { updatePetWithFormResponseSchema, updatePetWithFormErrorSchema } from '../../../zod/pet/updatePetWithFormSchema'

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
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
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'POST',
      url: '/pet/{petId}:search',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      validator: { response: updatePetWithFormResponseSchema, error: updatePetWithFormErrorSchema },
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<
      RequestResult<
        {
          '405': unknown
        },
        ThrowOnError
      >
    >,
  )
}
