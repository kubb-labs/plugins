import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  UpdatePetData,
  UpdatePetStatus200,
  UpdatePetStatus202,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/pet/UpdatePet.ts'
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
  { data }: { data: UpdatePetData },
  config: Partial<RequestConfig<UpdatePetData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestData = updatePetDataSchema.parse(data)

  const res = await request<
    UpdatePetStatus200 | UpdatePetStatus202,
    ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>,
    UpdatePetData
  >({ method: 'PUT', url: getUpdatePetUrl().url.toString(), data: requestData, contentType, ...requestConfig })

  return { ...res, data: updatePetResponseSchema.parse(res.data) }
}
