import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { UpdatePetData, UpdatePetResponse, UpdatePetStatus400, UpdatePetStatus404, UpdatePetStatus405 } from '../models/ts/UpdatePet.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePetHandler({ data }: { data: UpdatePetData }): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<UpdatePetResponse, ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>, UpdatePetData>({
    method: 'PUT',
    url: `/pet`,
    baseURL: `https://petstore.swagger.io/v2`,
    data: requestData,
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
