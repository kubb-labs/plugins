/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { CreatePetData, CreatePetStatus201, CreatePetStatus405 } from './CreatePet'
import { client } from './.kubb/client'
import { CreatePetStatus201, CreatePetStatus405, CreatePetData } from './CreatePet'
import { z } from 'zod'

export function getCreatePetUrl() {
  const res = { method: 'POST', url: `/pet` as const }

  return res
}

/**
 * {@link /pet}
 */
export async function createPet(data?: CreatePetData, config: Partial<RequestConfig<CreatePetData>> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const requestData = CreatePetData.parse(data)

  const res = await request<CreatePetStatus201 | CreatePetStatus405, ResponseErrorConfig<CreatePetStatus405>, z.output<typeof CreatePetData>>({
    method: 'POST',
    url: getCreatePetUrl().url.toString(),
    data: requestData,
    throwOnError: false,
    ...requestConfig,
  })

  return z.union([CreatePetStatus201, CreatePetStatus405]).parse(res.data)
}
