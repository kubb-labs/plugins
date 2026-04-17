import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  CreatePetsData,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsPathUuid,
  CreatePetsQueryBoolParam,
  CreatePetsQueryOffset,
  CreatePetsResponse,
} from '../../../models/ts/petsController/CreatePets.ts'
import { createPetsDataSchema, createPetsResponseSchema } from '../../../zod/petsController/createPetsSchema.ts'

export function getCreatePetsUrl({ uuid }: { uuid: CreatePetsPathUuid }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pets/${uuid}` as const }

  return res
}

/**
 * @summary Create a pet
 * {@link /pets/:uuid}
 */
export async function createPets(
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
  config: Partial<RequestConfig<CreatePetsData>> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const mappedParams = params ? { bool_param: params.boolParam, offset: params.offset } : undefined

  const mappedHeaders = headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined

  const requestData = createPetsDataSchema.parse(data)

  const res = await request<CreatePetsResponse, ResponseErrorConfig<Error>, CreatePetsData>({
    method: 'POST',
    url: getCreatePetsUrl({ uuid }).url.toString(),
    params: mappedParams,
    data: requestData,
    ...requestConfig,
    headers: { ...mappedHeaders, ...requestConfig.headers },
  })

  return { ...res, data: createPetsResponseSchema.parse(res.data) }
}
