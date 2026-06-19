/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { CreatePetData, CreatePetStatus201, CreatePetStatus405 } from './CreatePet'
import { client } from './.kubb/client'

export function getCreatePetUrl() {
  const res = { method: 'POST', url: `/pet` as const }

  return res
}

/**
 * {@link /pet}
 */
export async function createPet({ data }: { data?: CreatePetData } = {}, config: Partial<RequestConfig<CreatePetData>> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const requestData = data

  const res = await request<CreatePetStatus201 | CreatePetStatus405, ResponseErrorConfig<CreatePetStatus405>, CreatePetData>({
    method: 'POST',
    url: getCreatePetUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res as { status: 201; data: CreatePetStatus201; statusText: string } | { status: 405; data: CreatePetStatus405; statusText: string }
}
