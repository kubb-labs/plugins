import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { PlaceOrderPatchData, PlaceOrderPatchResponse, PlaceOrderPatchStatus405 } from '../models/ts/PlaceOrderPatch.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatchHandler({ data }: { data?: PlaceOrderPatchData } = {}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<PlaceOrderPatchResponse, ResponseErrorConfig<PlaceOrderPatchStatus405>, PlaceOrderPatchData>({
    method: 'PATCH',
    url: `/store/order`,
    baseURL: `https://petstore.swagger.io/v2`,
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
