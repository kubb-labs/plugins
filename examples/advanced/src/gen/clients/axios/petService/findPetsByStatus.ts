import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap } from '../../../.kubb/client'
import { findPetsByStatusResponseSchema, findPetsByStatusErrorSchema } from '../../../zod/pet/findPetsByStatusSchema'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export function findPetsByStatus<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body?: never
      path: {
        step_id: string
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
            data: Array<Pet>
          }
        | {
            contentType: 'application/xml'
            data: Array<Pet>
          }
      '400': unknown
    },
    ThrowOnError
  >
> {
  const { client: request = client, ...config } = options

  return withUnwrap(
    request({
      method: 'GET',
      url: '/pet/findByStatus/{step_id}',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      validator: { response: findPetsByStatusResponseSchema, error: findPetsByStatusErrorSchema },
      ...config,
      throwOnError: config.throwOnError ?? true,
    }) as Promise<
      RequestResult<
        {
          '200':
            | {
                contentType: 'application/json'
                data: Array<Pet>
              }
            | {
                contentType: 'application/xml'
                data: Array<Pet>
              }
          '400': unknown
        },
        ThrowOnError
      >
    >,
  )
}
