import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { DeletePetRequestConfig, DeletePetStatus400 } from '../../../models/ts/pet/DeletePet.ts'
import { deletePetResponseSchema } from '../../../zod/pet/deletePetSchema.ts'

export function getDeletePetUrl(path: DeletePetRequestConfig['path']) {
  const res = { method: 'DELETE', url: `https://petstore3.swagger.io/api/v3/pet/${path.petId}:search` as const }

  return res
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId:search}
 */
export async function deletePet({ path, headers }: Omit<DeletePetRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const mappedHeaders = headers ? { api_key: headers.apiKey } : undefined

  const res = await request<DeletePetStatus400, ResponseErrorConfig<DeletePetStatus400>, unknown>({
    method: 'DELETE',
    url: getDeletePetUrl(path).url.toString(),
    ...requestConfig,
    headers: { ...mappedHeaders, ...requestConfig.headers },
  })

  return { ...res, data: deletePetResponseSchema.parse(res.data) } as { status: 400; data: DeletePetStatus400; statusText: string }
}
