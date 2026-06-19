/* eslint-disable no-alert, no-console */

import client from 'axios'
import type { FindPetsByTagsRequestConfig, FindPetsByTagsStatus200 } from './FindPetsByTags'
import type { Client, RequestConfig, ResponseErrorConfig } from 'axios'

export function getFindPetsByTagsUrl() {
  const res = { method: 'GET', url: `/pet/findByTags` as const }

  return res
}

/**
 * {@link /pet/findByTags}
 */
export async function findPetsByTags({ query }: Omit<FindPetsByTagsRequestConfig, 'url'> = {}, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<FindPetsByTagsStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getFindPetsByTagsUrl().url.toString(),
    query,
    ...requestConfig,
  })

  return res.data
}
