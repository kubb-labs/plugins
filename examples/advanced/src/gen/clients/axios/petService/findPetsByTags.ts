import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsStatus200, FindPetsByTagsStatus400 } from '../../../models/ts/pet/FindPetsByTags.ts'
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
export async function findPetsByTags(
  { query, headers }: Omit<FindPetsByTagsRequestConfig, 'url'> = {},
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const mappedHeaders = headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined

  const res = await request<FindPetsByTagsStatus200 | FindPetsByTagsStatus400, ResponseErrorConfig<FindPetsByTagsStatus400>, unknown>({
    method: 'GET',
    url: getFindPetsByTagsUrl().url.toString(),
    query,
    ...requestConfig,
    headers: { ...mappedHeaders, ...requestConfig.headers },
  })

  return { ...res, data: findPetsByTagsResponseSchema.parse(res.data) } as
    | { status: 200; data: FindPetsByTagsStatus200; statusText: string }
    | { status: 400; data: FindPetsByTagsStatus400; statusText: string }
}
