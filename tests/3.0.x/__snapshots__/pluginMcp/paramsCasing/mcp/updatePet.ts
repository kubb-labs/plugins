import type { UpdatePetRequestConfig } from '../types/UpdatePet.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { updatePet } from '../clients/updatePet.ts'

/**
 * {@link /pets/:pet_id}
 */
export async function updatePetHandler({ path, query, body }: UpdatePetRequestConfig, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await updatePet({ path, query, body })

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