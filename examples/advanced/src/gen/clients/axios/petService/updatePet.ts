import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'
import { updatePetResponseSchema, updatePetStatus400Schema, updatePetStatus404Schema, updatePetStatus405Schema } from '../../../zod/pet/updatePetSchema'

/**
 * `PUT /pet`
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 */
export function updatePet<ThrowOnError extends boolean = true>(
  options: Options<
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType?:
          | 'application/json'
          | {
              request: 'application/json'
            }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType:
          | 'application/xml'
          | {
              request: 'application/xml'
            }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType:
          | 'application/x-www-form-urlencoded'
          | {
              request: 'application/x-www-form-urlencoded'
            }
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
  const { client: apiClient = client, contentType, ...config } = options

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
        '202': {
          id?: number
        }
        '400': unknown
        '404': unknown
        '405': unknown
      },
      ThrowOnError
    >({
      method: 'PUT',
      url: '/pet',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      contentType: { request: 'application/json', ...(typeof contentType === 'string' ? { request: contentType } : contentType) },
      ...config,
      validator: {
        response: updatePetResponseSchema,
        error: { 400: updatePetStatus400Schema, 404: updatePetStatus404Schema, 405: updatePetStatus405Schema },
        ...config.validator,
      },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
