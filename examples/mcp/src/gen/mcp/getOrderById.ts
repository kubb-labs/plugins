import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { GetOrderByIdPathOrderId, GetOrderByIdResponse, GetOrderByIdStatus400, GetOrderByIdStatus404 } from '../models/ts/GetOrderById.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function getOrderByIdHandler(
  { orderId }: { orderId: GetOrderByIdPathOrderId },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetOrderByIdResponse, ResponseErrorConfig<GetOrderByIdStatus400 | GetOrderByIdStatus404>, unknown>(
    { method: 'GET', url: `/store/order/${orderId}`, baseURL: `https://petstore.swagger.io/v2` },
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
