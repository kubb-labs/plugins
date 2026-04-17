import fetch from "@kubb/plugin-client/clients/axios";
import type { GetInventoryResponse } from "../../types/GetInventory.ts";
import type { ResponseErrorConfig } from "@kubb/plugin-client/clients/axios";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types";

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventoryHandler(): Promise<Promise<CallToolResult>> {




  const res = await fetch<GetInventoryResponse, ResponseErrorConfig<Error>, unknown>({ method: "GET", url: `/store/inventory` })

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