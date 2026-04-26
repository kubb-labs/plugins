import fetch from '@kubb/plugin-client/clients/axios'
import type { GetPetByIdPathPetId, GetPetByIdResponse, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../models/ts/petController/GetPetById.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export async function getPetByIdHandler(
  { petId }: { petId: GetPetByIdPathPetId },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await fetch<GetPetByIdResponse, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, unknown>(
    { method: 'GET', url: `/pet/${petId}:search`, baseURL: `https://petstore.swagger.io/v2` },
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
