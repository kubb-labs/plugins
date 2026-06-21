import type { CreatePetsData, CreatePetsHeaderXEXAMPLE, CreatePetsPathUuid, CreatePetsQueryOffset } from '../models/ts/CreatePets.js'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.js'

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

  const requestBody = data

  const res = await client({
    method: 'POST',
    url: `/pets/${uuid}`,
    baseURL: `https://petstore.swagger.io/v2`,
    query: params,
    body: requestBody,
    headers: { ...mappedHeaders },
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
