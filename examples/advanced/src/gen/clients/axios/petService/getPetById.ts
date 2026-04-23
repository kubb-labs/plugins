import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { GetPetByIdPathPetId, GetPetByIdResponse, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../../models/ts/petController/GetPetById.ts'
import { getPetByIdResponseSchema } from '../../../zod/petController/getPetByIdSchema.ts'

export function getGetPetByIdUrl({ petId }: { petId: GetPetByIdPathPetId }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/pet/${petId}:search` as const }

  return res
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId:search}
 */
export async function getPetById({ petId }: { petId: GetPetByIdPathPetId }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<GetPetByIdResponse, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, unknown>({
    method: 'GET',
    url: getGetPetByIdUrl({ petId }).url.toString(),
    ...requestConfig,
  })

  return { ...res, data: getPetByIdResponseSchema.parse(res.data) }
}
