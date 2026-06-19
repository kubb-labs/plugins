/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { CreatePetData, CreatePetResponse, CreatePetStatus201, CreatePetStatus405 } from './CreatePet'
import type { z } from 'zod'
import { client } from './.kubb/client'
import { CreatePetResponse, CreatePetData } from './CreatePet'

export function getCreatePetUrl() {
  const res = { method: 'POST', url: `/pet` as const }

  return res
}

/**
 * {@link /pet}
 */
export async function createPet({ data }: { data?: CreatePetData } = {}, config: Partial<RequestConfig<CreatePetData>> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const requestData = CreatePetData.parse(data)

  const res = await request<CreatePetStatus201 | CreatePetStatus405, ResponseErrorConfig<CreatePetStatus405>, z.input<typeof CreatePetData>>({
    method: 'POST',
    url: getCreatePetUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return { ...res, data: CreatePetResponse.parse(res.data) } as
    | { status: 201; data: CreatePetStatus201; statusText: string }
    | { status: 405; data: CreatePetStatus405; statusText: string }
}
