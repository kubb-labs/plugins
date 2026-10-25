import type { Options, Unwrappable, RequestResult } from '../../../.kubb/client'
import type { FindPetsByTagsXEXAMPLEKey } from '../../../models/ts/FindPetsByTagsXEXAMPLE'
import type { Pet } from '../../../models/ts/Pet'
import { client, withUnwrap } from '../../../.kubb/client'
import { findPetsByTagsResponseSchema, findPetsByTagsErrorSchema } from '../../../zod/pet/findPetsByTagsSchema'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
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
      url: '/pet/findByTags',
      security: [{ type: 'oauth2', scopes: ['write:pets', 'read:pets'] }],
      styles: { query: { tags: { explode: true } } },
      validator: { response: findPetsByTagsResponseSchema, error: findPetsByTagsErrorSchema },
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
