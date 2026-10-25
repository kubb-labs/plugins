import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import { client, withUnwrap } from '../../../.kubb/client'
import { deletePetResponseSchema, deletePetErrorSchema } from '../../../zod/pet/deletePetSchema'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
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
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'DELETE',
      url: '/pet/{petId}:search',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      validator: { response: deletePetResponseSchema, error: deletePetErrorSchema },
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<
      RequestResult<
        {
          '400': unknown
        },
        ThrowOnError
      >
    >,
  )
}
