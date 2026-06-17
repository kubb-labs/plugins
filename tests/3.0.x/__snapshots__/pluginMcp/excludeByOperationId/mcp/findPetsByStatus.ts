import type { ResponseErrorConfig } from '../.kubb/client.ts'
import type { FindPetsByStatusQueryStatus, FindPetsByStatusResponse, FindPetsByStatusStatus400 } from '../types/FindPetsByStatus.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.ts'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export async function findPetsByStatusHandler({ params }: { params?: { status?: FindPetsByStatusQueryStatus } } = {}, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await client<FindPetsByStatusResponse, ResponseErrorConfig<FindPetsByStatusStatus400>, unknown>({ method: "GET", url: `/pet/findByStatus`, params }, request)

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