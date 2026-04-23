import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { PlaceOrderPatchResponse, PlaceOrderPatchStatus405 } from '../models/ts/PlaceOrderPatch.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatchHandler({ data }: { data?: PlaceOrderPatchData } = {}): Promise<Promise<CallToolResult>> {
  const res = await fetch<PlaceOrderPatchResponse, ResponseErrorConfig<PlaceOrderPatchStatus405>, unknown>({
    method: 'PATCH',
    url: `/store/order`,
    baseURL: `https://petstore.swagger.io/v2`,
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
