import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsResponses } from '../../../models/ts/pet/FindPetsByTags.ts'
import { client } from '../../../.kubb/client.ts'
import { findPetsByTagsResponseSchema } from '../../../zod/pet/findPetsByTagsSchema.ts'

export function getFindPetsByTagsUrl() {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/pet/findByTags` as const }

  return res
}

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
    parser: { response: (data: unknown) => findPetsByTagsResponseSchema.parse(data) },
    ...config,
  }) as Promise<RequestResult<FindPetsByTagsResponses, ThrowOnError>>
}
