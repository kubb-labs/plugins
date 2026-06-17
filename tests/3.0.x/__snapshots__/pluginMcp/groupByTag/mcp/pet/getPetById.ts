import type { ResponseErrorConfig } from '../../.kubb/client.ts'
import type { GetPetByIdPathPetId, GetPetByIdResponse, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../types/GetPetById.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../../.kubb/client.ts'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export async function getPetByIdHandler({ petId }: { petId: GetPetByIdPathPetId }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await client<GetPetByIdResponse, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, unknown>({ method: "GET", url: `/pet/${petId}` }, request)

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