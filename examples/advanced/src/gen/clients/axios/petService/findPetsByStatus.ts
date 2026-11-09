import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap } from '../../../.kubb/client'
import { findPetsByStatusResponseSchema, findPetsByStatusStatus400Schema } from '../../../zod/pet/findPetsByStatusSchema'

/**
 * `GET /pet/findByStatus/{step_id}`
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * @param options - The request (`path`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
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
            data: string
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
      ...config,
      validator: { response: findPetsByStatusResponseSchema, error: { 400: findPetsByStatusStatus400Schema }, ...config.validator },
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
                data: string
              }
          '400': unknown
        },
        ThrowOnError
      >
    >,
  )
}
