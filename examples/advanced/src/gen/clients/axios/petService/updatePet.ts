import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdatePetResponse, UpdatePetStatus400, UpdatePetStatus404, UpdatePetStatus405 } from '../../../models/ts/petController/UpdatePet.ts'
import { updatePetResponseSchema } from '../../../zod/petController/updatePetSchema.ts'

export function getUpdatePetUrl() {
  const res = { method: 'PUT', url: `https://petstore3.swagger.io/api/v3/pet` as const }

  return res
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePet({ data }: { data: UpdatePetData }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<UpdatePetResponse, ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>, unknown>({
    method: 'PUT',
    url: getUpdatePetUrl().url.toString(),
    ...requestConfig,
  })

  return { ...res, data: updatePetResponseSchema.parse(res.data) }
}
