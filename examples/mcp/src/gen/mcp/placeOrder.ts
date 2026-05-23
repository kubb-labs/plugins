import client from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { PlaceOrderData, PlaceOrderResponse, PlaceOrderStatus405 } from '../models/ts/PlaceOrder.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrderHandler(
  { data }: { data?: PlaceOrderData } = {},
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await client<PlaceOrderResponse, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderData>(
    { method: 'POST', url: `/store/order`, baseURL: `https://petstore.swagger.io/v2`, data: requestData },
    request,
  )

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
