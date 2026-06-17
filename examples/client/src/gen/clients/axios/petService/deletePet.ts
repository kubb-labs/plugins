/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.js'
import type { DeletePetPathPetId, DeletePetHeaderApiKey, DeletePetResponse, DeletePetStatus400 } from '../../../models/ts/pet/DeletePet.js'
import { client } from '../../../.kubb/client.js'

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
  const { client: request = client, ...requestConfig } = config

  const res = await request<DeletePetResponse, ResponseErrorConfig<DeletePetStatus400>, unknown>({
    method: 'DELETE',
    url: getDeletePetUrl({ petId }).url.toString(),
    ...requestConfig,
    headers: { ...headers, ...requestConfig.headers },
  })

  return res.data
}
