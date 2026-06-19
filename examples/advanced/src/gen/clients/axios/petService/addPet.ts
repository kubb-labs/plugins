import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { AddPetRequestConfig, AddPetData, AddPetStatus405, AddPetStatusDefault } from '../../../models/ts/pet/AddPet.ts'
import type { z } from 'zod'
import { addPetResponseSchema, addPetDataSchema } from '../../../zod/pet/addPetSchema.ts'

export function getAddPetUrl() {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet` as const }

  return res
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPet(
  { body }: Omit<AddPetRequestConfig, 'url'>,
  config: Partial<RequestConfig<AddPetData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestData = addPetDataSchema.parse(body)

  const res = await request<AddPetStatus405 | AddPetStatusDefault, ResponseErrorConfig<AddPetStatus405>, z.input<typeof addPetDataSchema>>({
    method: 'POST',
    url: getAddPetUrl().url.toString(),
    body: requestData,
    contentType,
    ...requestConfig,
  })

  return { ...res, data: addPetResponseSchema.parse(res.data) } as
    | { status: 405; data: AddPetStatus405; statusText: string }
    | { status: number; data: AddPetStatusDefault; statusText: string }
}
