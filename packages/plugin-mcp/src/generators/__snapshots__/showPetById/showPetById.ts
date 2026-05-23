import type { ResponseErrorConfig } from './.kubb/client'
import type { ShowPetByIdPathPetId, ShowPetByIdResponse } from './ShowPetById'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from './.kubb/client'

/**
 * {@link /pets/:petId}
 */
export async function showPetByIdHandler(
  { petId }: { petId: ShowPetByIdPathPetId },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await client<ShowPetByIdResponse, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: `/pets/${petId}` }, request)

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
