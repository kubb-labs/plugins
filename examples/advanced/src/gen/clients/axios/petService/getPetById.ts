import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap } from '../../../.kubb/client'
import { getPetByIdResponseSchema, getPetByIdStatus400Schema, getPetByIdStatus404Schema } from '../../../zod/pet/getPetByIdSchema'

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
            data: Omit<NonNullable<Pet>, 'name'>
          }
        | {
            contentType: 'application/xml'
            data: string
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
      ...config,
      validator: { response: getPetByIdResponseSchema, error: { 400: getPetByIdStatus400Schema, 404: getPetByIdStatus404Schema }, ...config.validator },
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
                data: string
              }
          '400': unknown
          '404': unknown
        },
        ThrowOnError
      >
    >,
  )
}
