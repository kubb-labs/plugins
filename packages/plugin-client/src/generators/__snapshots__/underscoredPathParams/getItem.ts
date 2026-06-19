/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { GetItemRequestConfig, GetItemPathItemId, GetItemStatus200 } from './GetItem'
import { client } from './.kubb/client'

export function getGetItemUrl(path: { itemId: GetItemPathItemId }) {
  const res = { method: 'GET', url: `/v1/items/${path.itemId}` as const }

  return res
}

/**
 * {@link /v1/items/:item_id}
 */
export async function getItem({ path }: Omit<GetItemRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetItemStatus200, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: getGetItemUrl(path).url.toString(), ...requestConfig })

  return res.data
}
