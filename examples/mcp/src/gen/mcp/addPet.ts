import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { AddPetData, AddPetResponse, AddPetStatus405 } from '../models/ts/AddPet.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPetHandler(
  { data }: { data: AddPetData },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetData>(
    { method: 'POST', url: `/pet`, baseURL: `https://petstore.swagger.io/v2`, data: requestData },
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
