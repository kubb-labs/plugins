import client from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { CreatePetsData, CreatePetsHeaderXEXAMPLE, CreatePetsPathUuid, CreatePetsQueryOffset, CreatePetsResponse } from '../models/ts/CreatePets.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export async function createPetsHandler(
  {
    uuid,
    data,
    headers,
    params,
  }: { uuid: CreatePetsPathUuid; data: CreatePetsData; headers: { xEXAMPLE: CreatePetsHeaderXEXAMPLE }; params?: { offset?: CreatePetsQueryOffset } },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const mappedHeaders = headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined

  const requestData = data

  const res = await client<CreatePetsResponse, ResponseErrorConfig<Error>, CreatePetsData>(
    { method: 'POST', url: `/pets/${uuid}`, baseURL: `https://petstore.swagger.io/v2`, params, data: requestData, headers: { ...mappedHeaders } },
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
