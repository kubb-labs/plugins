import type { ResponseErrorConfig } from '../../.kubb/client.ts'
import type { UpdatePetData, UpdatePetResponse, UpdatePetStatus400, UpdatePetStatus404, UpdatePetStatus405 } from '../../types/UpdatePet.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../../.kubb/client.ts'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePetHandler({ data }: { data: UpdatePetData }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await client<UpdatePetResponse, ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>, UpdatePetData>({ method: "PUT", url: `/pet`, data: requestData }, request)

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