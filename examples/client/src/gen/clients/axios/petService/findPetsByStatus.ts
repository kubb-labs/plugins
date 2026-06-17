/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.js'
import type { FindPetsByStatusQueryStatus, FindPetsByStatusStatus200, FindPetsByStatusStatus400 } from '../../../models/ts/pet/FindPetsByStatus.js'
import { client } from '../../../.kubb/client.js'

function getFindPetsByStatusUrl() {
  const res = { method: 'GET', url: `/pet/findByStatus` as const }

  return res
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export async function findPetsByStatus(params?: { status?: FindPetsByStatusQueryStatus }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<FindPetsByStatusStatus200, ResponseErrorConfig<FindPetsByStatusStatus400>, unknown>({
    method: 'GET',
    url: getFindPetsByStatusUrl().url.toString(),
    params,
    ...requestConfig,
  })

  return res.data
}
