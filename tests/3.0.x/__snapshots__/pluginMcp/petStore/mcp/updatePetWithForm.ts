import type { ResponseErrorConfig } from '../.kubb/client.ts'
import type { UpdatePetWithFormPathPetId, UpdatePetWithFormQueryName, UpdatePetWithFormQueryStatus, UpdatePetWithFormResponse, UpdatePetWithFormStatus405 } from '../types/UpdatePetWithForm.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.ts'

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithFormHandler({ petId, params }: { petId: UpdatePetWithFormPathPetId; params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus } }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await client<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, unknown>({ method: "POST", url: `/pet/${petId}`, params }, request)

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