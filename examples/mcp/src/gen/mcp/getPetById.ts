import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { GetPetByIdPathPetId, GetPetByIdResponse, GetPetByIdStatus400, GetPetByIdStatus404 } from '../models/ts/GetPetById.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export async function getPetByIdHandler({ petId }: { petId: GetPetByIdPathPetId }): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetPetByIdResponse, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, unknown>({
    method: 'GET',
    url: `/pet/${petId}`,
    baseURL: `https://petstore.swagger.io/v2`,
  })

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
