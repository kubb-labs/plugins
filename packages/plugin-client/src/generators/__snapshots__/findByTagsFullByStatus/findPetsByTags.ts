/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { FindPetsByTagsQueryTags, FindPetsByTagsQueryStatus, FindPetsByTagsStatus200 } from './FindPetsByTags'
import { client } from './.kubb/client'

export function getFindPetsByTagsUrl() {
  const res = { method: 'GET', url: `/pet/findByTags` as const }

  return res
}

/**
 * {@link /pet/findByTags}
 */
export async function findPetsByTags(
  params: { tags: FindPetsByTagsQueryTags; status?: FindPetsByTagsQueryStatus },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<FindPetsByTagsStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getFindPetsByTagsUrl().url.toString(),
    params,
    ...requestConfig,
  })

  return res as { status: 200; data: FindPetsByTagsStatus200; statusText: string; headers: Headers }
}
