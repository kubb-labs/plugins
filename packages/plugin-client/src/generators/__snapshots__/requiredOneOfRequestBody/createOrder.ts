/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { CreateOrderRequestConfig, CreateOrderData, CreateOrderStatus200 } from './CreateOrder'
import { client } from './.kubb/client'

export function getCreateOrderUrl() {
  const res = { method: 'POST', url: `/orders` as const }

  return res
}

/**
 * {@link /orders}
 */
export async function createOrder({ body }: CreateOrderRequestConfig, config: Partial<RequestConfig<CreateOrderData>> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const requestBody = body

  const res = await request<CreateOrderStatus200, ResponseErrorConfig<Error>, CreateOrderData>({
    method: 'POST',
    url: getCreateOrderUrl().url.toString(),
    body: requestBody,
    ...requestConfig,
  })

  return res.data
}
