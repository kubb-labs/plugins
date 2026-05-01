import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddPetData, AddPetResponse, AddPetStatus405 } from '../../../models/ts/petController/AddPet.ts'
import { addPetResponseSchema, addPetDataSchema } from '../../../zod/petController/addPetSchema.ts'

export function getAddPetUrl() {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet` as const }

  return res
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPet({ data }: { data: AddPetData }, config: Partial<RequestConfig<AddPetData>> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = addPetDataSchema.parse(data)

  const res = await request<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, AddPetData>({
    method: 'POST',
    url: getAddPetUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return { ...res, data: addPetResponseSchema.parse(res.data) }
}
