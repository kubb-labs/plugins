import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { PlaceOrderData, PlaceOrderResponse, PlaceOrderStatus405 } from '../models/ts/PlaceOrder.js'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrderHandler({ data }: { data?: PlaceOrderData } = {}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<PlaceOrderResponse, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderData>({
    method: 'POST',
    url: '/store/order',
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
  })

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
    structuredContent: { data: res.data },
  }
}
