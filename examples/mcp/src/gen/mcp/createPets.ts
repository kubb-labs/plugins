import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { CreatePetsData, CreatePetsHeaderXEXAMPLE, CreatePetsPathUuid, CreatePetsQueryOffset, CreatePetsResponse } from '../models/ts/CreatePets.js'
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
  headers: { 'X-EXAMPLE': CreatePetsHeaderXEXAMPLE }
  params?: { offset?: CreatePetsQueryOffset }
}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreatePetsResponse, ResponseErrorConfig<Error>, CreatePetsData>({
    method: 'POST',
    url: `/pets/${uuid}`,
    baseURL: `https://petstore.swagger.io/v2`,
    params,
    data: requestData,
    headers: { ...headers },
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
