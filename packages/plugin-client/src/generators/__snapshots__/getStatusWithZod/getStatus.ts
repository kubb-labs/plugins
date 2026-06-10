/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { GetStatusStatus200, GetStatusStatus422 } from './GetStatus'
import { client } from './.kubb/client'
import { getStatusSuccessResponseSchema } from './getStatusSchema'

export function getGetStatusUrl() {
  const res = { method: 'GET', url: `/status` as const }

  return res
}

/**
 * {@link /status}
 */
export async function getStatus(config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetStatusStatus200, ResponseErrorConfig<GetStatusStatus422>, unknown>({
    method: 'GET',
    url: getGetStatusUrl().url.toString(),
    ...requestConfig,
  })

  return getStatusSuccessResponseSchema.parse(res.data)
}
