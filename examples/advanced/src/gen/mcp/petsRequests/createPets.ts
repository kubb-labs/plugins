import fetch from '@kubb/plugin-client/clients/axios'
import type {
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsPathUuid,
  CreatePetsQueryBoolParam,
  CreatePetsQueryOffset,
  CreatePetsResponse,
} from '../../models/ts/petsController/CreatePets.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export async function createPetsHandler({
  uuid,
  data,
  headers,
  params,
}: {
  uuid: CreatePetsPathUuid
  data: CreatePetsData
  headers: { xEXAMPLE: CreatePetsHeaderXEXAMPLE }
  params?: { boolParam?: CreatePetsQueryBoolParam; offset?: CreatePetsQueryOffset }
}): Promise<Promise<CallToolResult>> {
  const mappedParams = params ? { bool_param: params.boolParam, offset: params.offset } : undefined

  const mappedHeaders = headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined

  const requestData = data

  const res = await fetch<CreatePetsResponse, ResponseErrorConfig<Error>, CreatePetsData>({
    method: 'POST',
    url: `/pets/${uuid}`,
    baseURL: 'https://petstore.swagger.io/v2',
    params: mappedParams,
    data: requestData,
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
