import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsResponses } from '../../../models/ts/pet/FindPetsByTags.ts'
import { client } from '../../../.kubb/client.ts'
import { findPetsByTagsResponseSchema, findPetsByTagsErrorSchema } from '../../../zod/pet/findPetsByTagsSchema.ts'

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export function findPetsByTags<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByTagsRequestConfig, ThrowOnError>,
): Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'GET',
    url: '/pet/findByTags',
    security: [{ type: 'oauth2' }],
    parser: { response: (data: unknown) => findPetsByTagsResponseSchema.parse(data), error: (data: unknown) => findPetsByTagsErrorSchema.parse(data) },
    ...config,
  }) as Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>>
}
