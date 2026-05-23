import type { ResponseErrorConfig } from './.kubb/client'
import type { DeletePetPathPetId, DeletePetResponse } from './DeletePet'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from './.kubb/client'

/**
 * {@link /pets/:petId}
 */
export async function deletePetHandler(
  { petId }: { petId: DeletePetPathPetId },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await client<DeletePetResponse, ResponseErrorConfig<Error>, unknown>({ method: 'DELETE', url: `/pets/${petId}` }, request)

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
