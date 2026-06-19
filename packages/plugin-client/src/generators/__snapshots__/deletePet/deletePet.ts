/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { DeletePetRequestConfig, DeletePetPathPetId, DeletePetStatus200 } from './DeletePet'
import { client } from './.kubb/client'

export function getDeletePetUrl(path: { petId: DeletePetPathPetId }) {
  const res = { method: 'DELETE', url: `/pet/${path.petId}` as const }

  return res
}

/**
 * {@link /pet/:petId}
 */
export async function deletePet({ path, headers }: Omit<DeletePetRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const mappedHeaders = headers ? { api_key: headers.apiKey } : undefined

  const res = await request<DeletePetStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'DELETE',
    url: getDeletePetUrl(path).url.toString(),
    ...requestConfig,
    headers: { ...mappedHeaders, ...requestConfig.headers },
  })

  return res.data
}
