/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { FindPetsByTagsQueryTags, FindPetsByTagsQueryStatus, FindPetsByTagsStatus200 } from './FindPetsByTags'
import { client } from './.kubb/client'
import { FindPetsByTagsQueryTags } from './FindPetsByTags'

export function getFindPetsByTagsUrl() {
  const res = { method: 'GET', url: `/pet/findByTags` as const }

  return res
}

/**
 * {@link /pet/findByTags}
 */
export async function findPetsByTags(
  { params }: { params: { tags: FindPetsByTagsQueryTags; status?: FindPetsByTagsQueryStatus } },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const requestParams = FindPetsByTagsQueryTags.parse(params)

  const res = await request<FindPetsByTagsStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getFindPetsByTagsUrl().url.toString(),
    params: requestParams,
    ...requestConfig,
  })

  return res.data
}
