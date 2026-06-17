import type { ResponseErrorConfig } from '../.kubb/client.ts'
import type { DeleteOrderPathOrderId, DeleteOrderResponse, DeleteOrderStatus400, DeleteOrderStatus404 } from '../types/DeleteOrder.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.ts'

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function deleteOrderHandler({ orderId }: { orderId: DeleteOrderPathOrderId }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await client<DeleteOrderResponse, ResponseErrorConfig<DeleteOrderStatus400 | DeleteOrderStatus404>, unknown>({ method: "DELETE", url: `/store/order/${orderId}` }, request)

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