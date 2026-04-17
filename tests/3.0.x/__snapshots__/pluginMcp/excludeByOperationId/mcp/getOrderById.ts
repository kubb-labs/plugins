import fetch from "@kubb/plugin-client/clients/axios";
import type { GetOrderByIdPathOrderId, GetOrderByIdResponse, GetOrderByIdStatus400, GetOrderByIdStatus404 } from "../types/GetOrderById.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description For valid response try integer IDs with value <= 5 or > 10. Other values will generate exceptions.
 * @summary Find purchase order by ID
 * {@link /store/order/:orderId}
 */
export async function getOrderByIdHandler({ orderId }: { orderId: GetOrderByIdPathOrderId }): Promise<Promise<CallToolResult>> {




  const res = await fetch<GetOrderByIdResponse, ResponseErrorConfig<GetOrderByIdStatus400 | GetOrderByIdStatus404>, unknown>({ method: "GET", url: `/store/order/${orderId}` })

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