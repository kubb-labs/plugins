/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { FindPetsByStatusQueryStatus, FindPetsByStatusStatus200 } from './FindPetsByStatus'
import { client } from './.kubb/client'

export function getFindPetsByStatusUrl() {
  const res = { method: 'GET', url: `/pet/findByStatus` as const }

  return res
}

/**
 * {@link /pet/findByStatus}
 */
export async function findPetsByStatus(params?: { status?: FindPetsByStatusQueryStatus }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<FindPetsByStatusStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'GET',
    url: getFindPetsByStatusUrl().url.toString(),
    params,
    ...requestConfig,
  })

  return res.data
}
