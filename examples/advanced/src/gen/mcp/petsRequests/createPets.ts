import client from '@kubb/plugin-client/clients/axios'
import type {
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsPathUuid,
  CreatePetsQueryBoolParam,
  CreatePetsQueryOffset,
  CreatePetsResponse,
} from '../../models/ts/petsController/CreatePets.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
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

  const requestData = data

  const res = await client<CreatePetsResponse, ResponseErrorConfig<Error>, CreatePetsData>(
    { method: 'POST', url: `/pets/${uuid}`, baseURL: `https://petstore.swagger.io/v2`, params: mappedParams, data: requestData, headers: { ...mappedHeaders } },
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
