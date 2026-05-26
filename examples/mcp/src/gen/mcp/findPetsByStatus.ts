import client from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { FindPetsByStatusPathStepId, FindPetsByStatusResponse, FindPetsByStatusStatus400 } from '../models/ts/FindPetsByStatus.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatusHandler(
  { step_id }: { step_id: FindPetsByStatusPathStepId },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await client<FindPetsByStatusResponse, ResponseErrorConfig<FindPetsByStatusStatus400>, unknown>(
    { method: 'GET', url: `/pet/findByStatus/${step_id}`, baseURL: `https://petstore.swagger.io/v2` },
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
