import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { AddPetRequest } from '../../../models/ts/AddPetRequest'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap } from '../../../.kubb/client'
import { addPetResponseSchema, addPetErrorSchema } from '../../../zod/pet/addPetSchema'

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
        contentType?: {
          request: 'application/json'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
          request: 'application/xml'
        }
      }
    | {
        body: Omit<NonNullable<Pet>, 'id'>
        path?: never
        query?: never
        headers?: never
        contentType: {
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
            data: Omit<NonNullable<Pet>, 'name'>
          }
    },
    ThrowOnError
  >
> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request<
      (
        | {
            body: AddPetRequest
            path?: never
            query?: never
            headers?: never
            contentType?: {
              request: 'application/json'
            }
          }
        | {
            body: Omit<NonNullable<Pet>, 'id'>
            path?: never
            query?: never
            headers?: never
            contentType: {
              request: 'application/xml'
            }
          }
        | {
            body: Omit<NonNullable<Pet>, 'id'>
            path?: never
            query?: never
            headers?: never
            contentType: {
              request: 'application/x-www-form-urlencoded'
            }
          }
      )['body']
    >({
      method: 'POST',
      url: '/pet',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      validator: { response: addPetResponseSchema, error: addPetErrorSchema },
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<
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
                data: Omit<NonNullable<Pet>, 'name'>
              }
        },
        ThrowOnError
      >
    >,
  )
}
