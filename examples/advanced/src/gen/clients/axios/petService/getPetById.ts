import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'
import { getPetByIdResponseSchema, getPetByIdStatus400Schema, getPetByIdStatus404Schema } from '../../../zod/pet/getPetByIdSchema'

/**
 * `GET /pet/{petId}:search`
 * @description Returns a single pet
 * @summary Find pet by ID
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
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
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
    >({
      method: 'GET',
      url: '/pet/{petId}:search',
      security: [
        { type: 'apiKey', name: 'api_key', in: 'header' },
        { type: 'oauth2', scopes: ['write:pets', 'read:pets'], flows: { implicit: { authorizationUrl: 'https://petstore3.swagger.io/oauth/authorize' } } },
      ],
      ...config,
      validator: { response: getPetByIdResponseSchema, error: { 400: getPetByIdStatus400Schema, 404: getPetByIdStatus404Schema }, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
