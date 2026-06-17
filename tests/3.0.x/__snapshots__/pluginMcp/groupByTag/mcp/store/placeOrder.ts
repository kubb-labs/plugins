import type { ResponseErrorConfig } from '../../.kubb/client.ts'
import type { PlaceOrderData, PlaceOrderResponse, PlaceOrderStatus405 } from '../../types/PlaceOrder.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../../.kubb/client.ts'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrderHandler({ data }: { data?: PlaceOrderData } = {}, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await client<PlaceOrderResponse, ResponseErrorConfig<PlaceOrderStatus405>, PlaceOrderData>({ method: "POST", url: `/store/order`, data: requestData }, request)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data)
      }
    ],
    structuredContent: { data: res.data }
  }
}