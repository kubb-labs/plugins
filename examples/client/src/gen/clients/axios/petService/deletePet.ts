/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type { DeletePetRequestConfig, DeletePetPathPetId, DeletePetResponse, DeletePetStatus400 } from '../../../models/ts/pet/DeletePet.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getDeletePetUrl({ petId }: { petId: DeletePetPathPetId }) {
  const res = { method: 'DELETE', url: `/pet/${petId}` as const }

  return res
}

/**
 * @description delete a pet
 * @summary Deletes a pet
 * {@link /pet/:petId}
 */
export async function deletePet({ path, headers }: Omit<DeletePetRequestConfig, 'url'>, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const mappedHeaders = headers ? { api_key: headers.apiKey } : undefined

  const res = await request<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, unknown>({
    method: 'DELETE',
    url: getDeletePetUrl(path).url.toString(),
    ...requestConfig,
    headers: { ...mappedHeaders, ...requestConfig.headers },
  })

  return res.data
}
