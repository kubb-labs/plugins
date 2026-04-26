import fetch from '@kubb/plugin-client/clients/axios'
import type { FindPetsByStatusPathStepId, FindPetsByStatusResponse, FindPetsByStatusStatus400 } from '../../models/ts/petController/FindPetsByStatus.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatusHandler(
  { stepId }: { stepId: FindPetsByStatusPathStepId },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const step_id = stepId

  const res = await fetch<FindPetsByStatusResponse, ResponseErrorConfig<FindPetsByStatusStatus400>, unknown>(
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
