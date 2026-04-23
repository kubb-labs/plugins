/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { DeletePetPathPetId, DeletePetHeaderApiKey, DeletePetResponse, DeletePetStatus400 } from '../../../models/ts/petController/DeletePet.js'
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
export async function deletePet(
  { petId }: { petId: DeletePetPathPetId },
  headers?: { api_key?: DeletePetHeaderApiKey },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, unknown>({
    method: 'DELETE',
    url: getDeletePetUrl({ petId }).url.toString(),
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })

  return res.data
}
