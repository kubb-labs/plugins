import client from '@kubb/plugin-client/clients/axios'
import type { DeletePetHeaderApiKey, DeletePetPathPetId, DeletePetResponse, DeletePetStatus400 } from '../../models/ts/petController/DeletePet.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export async function deletePetHandler(
  { petId, headers }: { petId: DeletePetPathPetId; headers?: { apiKey?: DeletePetHeaderApiKey } },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const mappedHeaders = headers ? { api_key: headers.apiKey } : undefined

  const res = await client<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, unknown>(
    { method: 'DELETE', url: `/pet/${petId}:search`, baseURL: `https://petstore.swagger.io/v2`, headers: { ...mappedHeaders } },
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
