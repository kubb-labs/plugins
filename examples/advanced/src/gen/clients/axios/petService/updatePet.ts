import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetRequestConfig,
  UpdatePetData,
  UpdatePetStatus200,
  UpdatePetStatus202,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/pet/UpdatePet.ts'
import type { z } from 'zod'
import { updatePetResponseSchema, updatePetDataSchema } from '../../../zod/pet/updatePetSchema.ts'

export function getUpdatePetUrl() {
  const res = { method: 'PUT', url: `https://petstore3.swagger.io/api/v3/pet` as const }

  return res
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePet(
  { body }: UpdatePetRequestConfig,
  config: Partial<RequestConfig<UpdatePetData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestBody = updatePetDataSchema.parse(body)

  const res = await request<
    UpdatePetStatus200 | UpdatePetStatus202 | UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    z.input<typeof updatePetDataSchema>
  >({ method: 'PUT', url: getUpdatePetUrl().url.toString(), body: requestBody, contentType, ...requestConfig })

  return { ...res, data: updatePetResponseSchema.parse(res.data) } as
    | { status: 200; data: UpdatePetStatus200; statusText: string }
    | { status: 202; data: UpdatePetStatus202; statusText: string }
    | { status: 400; data: UpdatePetStatus400; statusText: string }
    | { status: 404; data: UpdatePetStatus404; statusText: string }
    | { status: 405; data: UpdatePetStatus405; statusText: string }
}
