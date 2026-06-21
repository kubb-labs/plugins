import type {
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsPathUuid,
  CreatePetsQueryBoolParam,
  CreatePetsQueryOffset,
} from '../../models/ts/pets/CreatePets.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../../.kubb/client.ts'

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
  }: {
    uuid: CreatePetsPathUuid
    data: CreatePetsData
    headers: { xEXAMPLE: CreatePetsHeaderXEXAMPLE }
    params?: { boolParam?: CreatePetsQueryBoolParam; offset?: CreatePetsQueryOffset }
  },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const mappedParams = params ? { bool_param: params.boolParam, offset: params.offset } : undefined

  const mappedHeaders = headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined

  const requestBody = data

  const res = await client({
    method: 'POST',
    url: `/pets/${uuid}`,
    baseURL: `https://petstore.swagger.io/v2`,
    query: mappedParams,
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
