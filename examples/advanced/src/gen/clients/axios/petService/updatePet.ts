import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap } from '../../../.kubb/client'
import { updatePetResponseSchema, updatePetErrorSchema } from '../../../zod/pet/updatePetSchema'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export function updatePet<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body: Omit<NonNullable<Pet>, 'id'>
      path?: never
      query?: never
      headers?: never
    },
    ThrowOnError
  >,
): Unwrappable<
  RequestResult<
    {
      '200':
        | {
            contentType: 'application/json'
            data: Omit<NonNullable<Pet>, 'name'>
          }
        | {
            contentType: 'application/xml'
            data: Omit<NonNullable<Pet>, 'name'>
          }
      '202': {
        id?: number
      }
      '400': unknown
      '404': unknown
      '405': unknown
    },
    ThrowOnError
  >
> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'PUT',
      url: '/pet',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      validator: { response: updatePetResponseSchema, error: updatePetErrorSchema },
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<
      RequestResult<
        {
          '200':
            | {
                contentType: 'application/json'
                data: Omit<NonNullable<Pet>, 'name'>
              }
            | {
                contentType: 'application/xml'
                data: Omit<NonNullable<Pet>, 'name'>
              }
          '202': {
            id?: number
          }
          '400': unknown
          '404': unknown
          '405': unknown
        },
        ThrowOnError
      >
    >,
  )
}
