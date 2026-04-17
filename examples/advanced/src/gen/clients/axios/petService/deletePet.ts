import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeletePetPathPetId, DeletePetHeaderApiKey, DeletePetResponse, DeletePetStatus400 } from '../../../models/ts/petController/DeletePet.ts'
import { deletePetResponseSchema } from '../../../zod/petController/deletePetSchema.ts'

export function getDeletePetUrl({ petId }: { petId: DeletePetPathPetId }) {
  const res = { method: 'DELETE', url: `https://petstore3.swagger.io/api/v3/pet/${petId}:search` as const }

  return res
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export async function deletePet(
  { petId, headers }: { petId: DeletePetPathPetId; headers?: { apiKey?: DeletePetHeaderApiKey } },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const mappedHeaders = headers ? { api_key: headers.apiKey } : undefined

  const res = await request<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, unknown>({
    method: 'DELETE',
    url: getDeletePetUrl({ petId }).url.toString(),
    ...requestConfig,
    headers: { ...mappedHeaders, ...requestConfig.headers },
  })

  return { ...res, data: deletePetResponseSchema.parse(res.data) }
}
