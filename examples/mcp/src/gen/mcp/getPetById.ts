import type { GetPetByIdPathPetId } from '../models/ts/GetPetById.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.js'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export async function getPetByIdHandler(
  { petId }: { petId: GetPetByIdPathPetId },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await client({ method: 'GET', url: `/pet/${petId}`, baseURL: `https://petstore.swagger.io/v2` })

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
