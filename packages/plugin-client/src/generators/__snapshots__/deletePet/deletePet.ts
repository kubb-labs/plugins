/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { DeletePetPathPetId, DeletePetHeaderApiKey, DeletePetStatus200 } from './DeletePet'
import { client } from './.kubb/client'

export function getDeletePetUrl({ petId }: { petId: DeletePetPathPetId }) {
  const res = { method: 'DELETE', url: `/pet/${petId}` as const }

  return res
}

/**
 * {@link /pet/:petId}
 */
export async function deletePet(
  { petId, headers }: { petId: DeletePetPathPetId; headers?: { apiKey?: DeletePetHeaderApiKey } },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const mappedHeaders = headers ? { api_key: headers.apiKey } : undefined

  const res = await request<DeletePetStatus200, ResponseErrorConfig<Error>, unknown>({
    method: 'DELETE',
    url: getDeletePetUrl({ petId }).url.toString(),
    ...requestConfig,
    headers: { ...mappedHeaders, ...requestConfig.headers },
  })

  return res.data
}
