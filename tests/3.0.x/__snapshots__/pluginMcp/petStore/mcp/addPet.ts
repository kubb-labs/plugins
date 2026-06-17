import type { ResponseErrorConfig } from '../.kubb/client.ts'
import type { AddPetData, AddPetResponse, AddPetStatus405 } from '../types/AddPet.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.ts'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPetHandler({ data }: { data: AddPetData }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await client<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetData>({ method: "POST", url: `/pet`, data: requestData }, request)

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