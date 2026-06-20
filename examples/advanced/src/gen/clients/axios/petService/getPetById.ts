import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { GetPetByIdRequestConfig, GetPetByIdStatus200, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../../models/ts/pet/GetPetById.ts'
import { getPetByIdResponseSchema } from '../../../zod/pet/getPetByIdSchema.ts'

export function getGetPetByIdUrl(path: GetPetByIdRequestConfig['path']) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/pet/${path.petId}:search` as const }

  return res
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export async function getPetById({ path }: GetPetByIdRequestConfig, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<
    GetPetByIdStatus200 | GetPetByIdStatus400 | GetPetByIdStatus404,
    ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>,
    unknown
  >({ method: 'GET', url: getGetPetByIdUrl(path).url.toString(), ...requestConfig })

  return { ...res, data: getPetByIdResponseSchema.parse(res.data) } as
    | { status: 200; data: GetPetByIdStatus200; statusText: string }
    | { status: 400; data: GetPetByIdStatus400; statusText: string }
    | { status: 404; data: GetPetByIdStatus404; statusText: string }
}
