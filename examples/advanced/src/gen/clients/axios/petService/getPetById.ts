import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { GetPetByIdPathPetId, GetPetByIdStatus200, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../../models/ts/pet/GetPetById.ts'
import { getPetByIdResponseSchema } from '../../../zod/pet/getPetByIdSchema.ts'

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
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetPetByIdStatus200, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, unknown>({
    method: 'GET',
    url: getGetPetByIdUrl({ petId }).url.toString(),
    ...requestConfig,
  })

  return { ...res, data: getPetByIdResponseSchema.parse(res.data) }
}
