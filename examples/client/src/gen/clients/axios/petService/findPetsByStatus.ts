/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { FindPetsByStatusQueryStatus, FindPetsByStatusResponse, FindPetsByStatusStatus400 } from '../../../models/ts/petController/FindPetsByStatus.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getFindPetsByStatusUrl() {
  const res = { method: 'GET', url: '/pet/findByStatus' as const }

  return res
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export async function findPetsByStatus(params?: { status?: FindPetsByStatusQueryStatus }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<FindPetsByStatusResponse, ResponseErrorConfig<FindPetsByStatusStatus400>, unknown>({
    method: 'GET',
    url: getFindPetsByStatusUrl().url.toString(),
    params,
    ...requestConfig,
  })

  return res.data
}
