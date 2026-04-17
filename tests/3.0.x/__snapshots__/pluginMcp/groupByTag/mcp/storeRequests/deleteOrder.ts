import fetch from "@kubb/plugin-client/clients/axios";
import type { DeleteOrderPathOrderId, DeleteOrderResponse, DeleteOrderStatus400, DeleteOrderStatus404 } from "../../types/DeleteOrder.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description For valid response try integer IDs with value < 1000. Anything above 1000 or nonintegers will generate API errors
 * @summary Delete purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function deleteOrderHandler({ orderId }: { orderId: DeleteOrderPathOrderId }): Promise<Promise<CallToolResult>> {




  const res = await fetch<DeleteOrderResponse, ResponseErrorConfig<DeleteOrderStatus400 | DeleteOrderStatus404>, unknown>({ method: "DELETE", url: `/store/order/${orderId}` })

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