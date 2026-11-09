import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { AddPetRequest } from '../../../models/ts/AddPetRequest'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'
import { addPetResponseSchema, addPetStatus405Schema, addPetStatusDefaultSchema } from '../../../zod/pet/addPetSchema'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<
    | {
        body: AddPetRequest
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
      '405': {
        code?: number
        message?: string
      }
      default:
        | {
            contentType: 'application/json'
            data: Omit<NonNullable<Pet>, 'name'>
          }
        | {
            contentType: 'application/xml'
            data: string
          }
    },
    ThrowOnError
  >
> {
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
      {
        '405': {
          code?: number
          message?: string
        }
        default:
          | {
              contentType: 'application/json'
              data: Omit<NonNullable<Pet>, 'name'>
            }
          | {
              contentType: 'application/xml'
              data: string
            }
      },
      ThrowOnError
    >({
      method: 'POST',
      url: '/pet',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      contentType: { request: 'application/json' },
      ...config,
      validator: { response: addPetResponseSchema, error: { 405: addPetStatus405Schema, default: addPetStatusDefaultSchema }, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
