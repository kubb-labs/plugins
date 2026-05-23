/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { HttpValidationError } from './HttpValidationError'
import type { Pet } from './Pet'
import { client } from './.kubb/client'

export function getAddPetUrl() {
  const res = { method: 'POST', url: `/pet` as const }

  return res
}

/**
 * {@link /pet}
 */
export async function addPet(data?: Pet, config: Partial<RequestConfig<Pet>> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const requestData = data

  const res = await request<Pet, ResponseErrorConfig<HttpValidationError>, Pet>({
    method: 'POST',
    url: getAddPetUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res.data
}
