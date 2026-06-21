import type { FindPetsByStatusPathStepId } from '../../models/ts/pet/FindPetsByStatus.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../../.kubb/client.ts'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatusHandler(
  { stepId }: { stepId: FindPetsByStatusPathStepId },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await client({ method: 'GET', url: `/pet/findByStatus/${stepId}`, baseURL: `https://petstore.swagger.io/v2` })

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
