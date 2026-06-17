/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type {
  FindPetsByTagsQueryTags,
  FindPetsByTagsQueryPage,
  FindPetsByTagsQueryPageSize,
  FindPetsByTagsStatus200,
  FindPetsByTagsStatus400,
} from '../../../models/ts/pet/FindPetsByTags.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getFindPetsByTagsUrl() {
  const res = { method: 'GET', url: `/pet/findByTags` as const }

  return res
}

/**
 * @description Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.
 * @summary Finds Pets by tags
 * {@link /pet/findByTags}
 */
export async function findPetsByTags(
  params?: { tags?: FindPetsByTagsQueryTags; page?: FindPetsByTagsQueryPage; pageSize?: FindPetsByTagsQueryPageSize },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<FindPetsByTagsStatus200, ResponseErrorConfig<FindPetsByTagsStatus400>, unknown>({
    method: 'GET',
    url: getFindPetsByTagsUrl().url.toString(),
    params,
    ...requestConfig,
  })

  return res.data
}
