/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.js'
import type { GetPetByIdPathPetId, GetPetByIdStatus200, GetPetByIdStatus400, GetPetByIdStatus404 } from '../../../models/ts/pet/GetPetById.js'
import { client } from '../../../.kubb/client.js'

function getGetPetByIdUrl({ petId }: { petId: GetPetByIdPathPetId }) {
  const res = { method: 'GET', url: `/pet/${petId}` as const }

  return res
}

/**
 * @description Returns a single pet
 * @summary Find pet by ID
 * {@link /pet/:petId}
 */
export async function getPetById({ petId }: { petId: GetPetByIdPathPetId }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetPetByIdStatus200, ResponseErrorConfig<GetPetByIdStatus400 | GetPetByIdStatus404>, unknown>({
    method: 'GET',
    url: getGetPetByIdUrl({ petId }).url.toString(),
    ...requestConfig,
  })

  return res.data
}
