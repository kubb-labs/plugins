/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsResponse, FindPetsByTagsStatus200 } from './FindPetsByTags'
import { client } from './.kubb/client'
import { FindPetsByTagsResponse, FindPetsByTagsQueryTags } from './FindPetsByTags'

export function getFindPetsByTagsUrl() {
  const res = { method: 'GET', url: `/pet/findByTags` as const }

  return res
}

/**
 * {@link /pet/findByTags}
 */
export async function findPetsByTags({ query }: FindPetsByTagsRequestConfig, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const requestParams = FindPetsByTagsQueryTags.parse(query)

  const res = await request<FindPetsByTagsStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getFindPetsByTagsUrl().url.toString(),
    query: requestParams,
    ...requestConfig,
  })

  return FindPetsByTagsResponse.parse(res.data)
}
