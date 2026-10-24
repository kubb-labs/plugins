import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap } from '../../../.kubb/client'
import { getPetByIdResponseSchema, getPetByIdErrorSchema } from '../../../zod/pet/getPetByIdSchema'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body?: never
      path: {
        petId: number
      }
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
            data: Pet
          }
        | {
            contentType: 'application/xml'
            data: Pet
          }
      '400': unknown
      '404': unknown
    },
    ThrowOnError
  >
> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'GET',
      url: '/pet/{petId}:search',
      security: [
        { type: 'apiKey', name: 'api_key', in: 'header' },
        { type: 'oauth2', scopes: ['write:pets', 'read:pets'] },
      ],
      validator: { response: getPetByIdResponseSchema, error: getPetByIdErrorSchema },
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<
      RequestResult<
        {
          '200':
            | {
                contentType: 'application/json'
                data: Pet
              }
            | {
                contentType: 'application/xml'
                data: Pet
              }
          '400': unknown
          '404': unknown
        },
        ThrowOnError
      >
    >,
  )
}
