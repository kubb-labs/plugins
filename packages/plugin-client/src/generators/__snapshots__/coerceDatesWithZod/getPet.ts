/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { GetPetPathPetId, GetPetResponse, GetPetStatus200 } from './GetPet'
import { client } from './.kubb/client'
import { GetPetResponse } from './GetPet'

export function getGetPetUrl(petId: GetPetPathPetId) {
  const res = { method: 'GET', url: `/pet/${petId}` as const }

  return res
}

/**
 * {@link /pet/:petId}
 */
export async function getPet(petId: GetPetPathPetId, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<GetPetStatus200, ResponseErrorConfig<Error>, unknown>({ method: 'GET', url: getGetPetUrl(petId).url.toString(), ...requestConfig })

  return GetPetResponse.parse(res.data)
}
