import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { FindPetsByTagsXEXAMPLEKey } from '../../../models/ts/FindPetsByTagsXEXAMPLE'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap, resolveThrowOnError } from '../../../.kubb/client'
import { findPetsByTagsResponseSchema, findPetsByTagsStatus400Schema } from '../../../zod/pet/findPetsByTagsSchema'

/**
 * `GET /pet/findByTags`
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * @param options - The request (`query`, `headers`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
 */
export function findPetsByTags<ThrowOnError extends boolean = true>(
  options: Options<
    {
      body?: never
      path?: never
      query?: {
        tags?: Array<string>
        page?: string
        pageSize?: number
      }
      headers: {
        'X-EXAMPLE': FindPetsByTagsXEXAMPLEKey
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
  const { client: apiClient = client, ...config } = options

  return withUnwrap(
    apiClient<
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
    >({
      method: 'GET',
      url: '/pet/findByTags',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      ...config,
      styles: { ...config.styles, query: { tags: { explode: true }, ...config.styles?.query } },
      validator: { response: findPetsByTagsResponseSchema, error: { 400: findPetsByTagsStatus400Schema }, ...config.validator },
      throwOnError: resolveThrowOnError(config.throwOnError, true),
    }),
  )
}
