import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsPathUuid,
  CreatePetsQueryBoolParam,
  CreatePetsQueryOffset,
  CreatePetsHeaderXEXAMPLE,
  CreatePetsData,
  CreatePetsStatus201,
  CreatePetsStatusDefault,
} from '../../../models/ts/pets/CreatePets.ts'
import type { z } from 'zod'
import { createPetsResponseSchema, createPetsDataSchema } from '../../../zod/pets/createPetsSchema.ts'

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
  const { client: request = client, ...requestConfig } = config

  const mappedParams = params ? { bool_param: params.boolParam, offset: params.offset } : undefined

  const mappedHeaders = headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined

  const requestData = createPetsDataSchema.parse(data)

  const res = await request<CreatePetsStatus201 | CreatePetsStatusDefault, ResponseErrorConfig<Error>, z.output<typeof createPetsDataSchema>>({
    method: 'POST',
    url: getCreatePetsUrl({ uuid }).url.toString(),
    params: mappedParams,
    data: requestData,
    ...requestConfig,
    headers: { ...mappedHeaders, ...requestConfig.headers },
  })

  return { ...res, data: createPetsResponseSchema.parse(res.data) } as
    | { status: 201; data: CreatePetsStatus201; statusText: string }
    | { status: number; data: CreatePetsStatusDefault; statusText: string }
}
