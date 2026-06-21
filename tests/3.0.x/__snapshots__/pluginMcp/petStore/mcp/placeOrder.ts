import type { Options, RequestResult } from '../.kubb/client.ts'
import type { PlaceOrderRequestConfig, PlaceOrderResponses } from '../types/PlaceOrder.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.ts'

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export function placeOrder<ThrowOnError extends boolean = true>(options: Options<PlaceOrderRequestConfig, ThrowOnError>): Promise<RequestResult<PlaceOrderResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/store/order', ...config }) as Promise<RequestResult<PlaceOrderResponses, ThrowOnError>>
}

/**
 * @description Place a new order in the store
 * @summary Place an order for a pet
 * {@link /store/order}
 */
export async function placeOrderHandler({ body }: PlaceOrderRequestConfig, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await placeOrder({ body })

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