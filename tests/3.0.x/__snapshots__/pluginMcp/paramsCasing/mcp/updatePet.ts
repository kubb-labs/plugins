import type { UpdatePetOptions } from '../types/UpdatePet'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types.js'
import { updatePet } from '../clients/updatePet'

/**
 * {@link /pets/:pet_id}
 */
export async function updatePetHandler({ path, query, body, headers }: UpdatePetOptions, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await updatePet({ path, query, headers, body, signal: request.signal })

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
