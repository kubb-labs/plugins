/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { UpdatePetWithFormPathPetId, UpdatePetWithFormData, UpdatePetWithFormResponse } from './UpdatePetWithForm'
import { fetch } from './.kubb/client'

export function getUpdatePetWithFormUrl(petId: UpdatePetWithFormPathPetId) {
  const res = { method: 'POST', url: `/pet/${petId}` as const }

  return res
}

/**
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(
  petId: UpdatePetWithFormPathPetId,
  data?: UpdatePetWithFormData,
  config: Partial<RequestConfig<UpdatePetWithFormData>> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data

  const res = await request<UpdatePetWithFormResponse, ResponseErrorConfig<Error>, UpdatePetWithFormData>({
    method: 'POST',
    url: getUpdatePetWithFormUrl(petId).url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res.data
}
