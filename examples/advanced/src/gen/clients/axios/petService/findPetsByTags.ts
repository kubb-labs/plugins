import type { Options, RequestResult } from '../../../.kubb/client'
import type { FindPetsByTagsOptions, FindPetsByTagsResponses } from '../../../models/ts/pet/FindPetsByTags'
import { client } from '../../../.kubb/client'
import { findPetsByTagsResponseSchema, findPetsByTagsErrorSchema } from '../../../zod/pet/findPetsByTagsSchema'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function findPetsByTags<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByTagsOptions, ThrowOnError>,
): Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'GET',
    url: '/pet/findByTags',
    security: [{ type: 'oauth2' }],
    styles: { query: { tags: { explode: true } } },
    validator: { response: findPetsByTagsResponseSchema, error: findPetsByTagsErrorSchema },
    ...config,
    headers: config.headers ? { 'X-EXAMPLE': config.headers.xEXAMPLE } : config.headers,
  }) as Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>>
}
