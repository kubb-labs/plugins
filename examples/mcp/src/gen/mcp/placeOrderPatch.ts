import type { PlaceOrderPatchData } from '../models/ts/PlaceOrderPatch.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.js'

/**
 * @description Place a new order in the store with patch
 * @summary Place an order for a pet with patch
 * {@link /store/order}
 */
export async function placeOrderPatchHandler(
  { data }: { data?: PlaceOrderPatchData } = {},
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const requestBody = data

  const res = await client({ method: 'PATCH', url: `/store/order`, baseURL: `https://petstore.swagger.io/v2`, body: requestBody })

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
