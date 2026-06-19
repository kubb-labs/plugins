import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreatePetsRequestConfig,
  CreatePetsPathUuid,
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
  { path, query, body, headers }: Omit<CreatePetsRequestConfig, 'url'>,
  config: Partial<RequestConfig<CreatePetsData>> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const mappedParams = query ? { bool_param: query.boolParam, offset: query.offset } : undefined

  const mappedHeaders = headers ? { 'X-EXAMPLE': headers.xEXAMPLE } : undefined

  const requestBody = createPetsDataSchema.parse(body)

  const res = await request<CreatePetsStatus201 | CreatePetsStatusDefault, ResponseErrorConfig<Error>, z.input<typeof createPetsDataSchema>>({
    method: 'POST',
    url: getCreatePetsUrl(path).url.toString(),
    query: mappedParams,
    body: requestBody,
    ...requestConfig,
    headers: { ...mappedHeaders, ...requestConfig.headers },
  })

  return { ...res, data: createPetsResponseSchema.parse(res.data) } as
    | { status: 201; data: CreatePetsStatus201; statusText: string }
    | { status: number; data: CreatePetsStatusDefault; statusText: string }
}
