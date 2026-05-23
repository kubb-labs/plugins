/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { AddPetData, AddPetStatus200, AddPetStatus422 } from './AddPet'
import { client } from './.kubb/client'

export function getAddPetUrl() {
  const res = { method: 'POST', url: `/pet` as const }

  return res
}

/**
 * {@link /pet}
 */
export async function addPet(data?: AddPetData, config: Partial<RequestConfig<AddPetData>> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const requestData = data

  const res = await request<AddPetStatus200, ResponseErrorConfig<AddPetStatus422>, AddPetData>({
    method: 'POST',
    url: getAddPetUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res.data
}
