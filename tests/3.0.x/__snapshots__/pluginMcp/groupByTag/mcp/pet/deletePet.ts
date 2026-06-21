import type { DeletePetHeaderApiKey, DeletePetPathPetId } from '../../types/DeletePet.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../../.kubb/client.ts'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
export async function deletePetHandler({ petId, headers }: { petId: DeletePetPathPetId; headers?: { apiKey?: DeletePetHeaderApiKey } }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const mappedHeaders = headers ? { "api_key": headers.apiKey } : undefined

  const res = await client({ method: "DELETE", url: `/pet/${petId}`, headers: { ...mappedHeaders } })

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