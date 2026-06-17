import client from '@kubb/plugin-client/clients/axios'
import type { GetInventoryResponse } from '../types/GetInventory.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @description Returns a map of status codes to quantities
 * @summary Returns pet inventories by status
 * {@link /store/inventory}
 */
export async function getInventoryHandler(request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await client<GetInventoryResponse, ResponseErrorConfig<Error>, unknown>({ method: "GET", url: `/store/inventory` }, request)

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