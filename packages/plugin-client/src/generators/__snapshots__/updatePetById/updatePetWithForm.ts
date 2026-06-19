/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { UpdatePetWithFormPathPetId, UpdatePetWithFormData, UpdatePetWithFormStatus200 } from './UpdatePetWithForm'
import { client } from './.kubb/client'

export function getUpdatePetWithFormUrl({ petId }: { petId: UpdatePetWithFormPathPetId }) {
  const res = { method: 'POST', url: `/pet/${petId}` as const }

  return res
}

/**
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(
  { petId, data }: { petId: UpdatePetWithFormPathPetId; data?: UpdatePetWithFormData },
  config: Partial<RequestConfig<UpdatePetWithFormData>> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const requestData = data

  const res = await request<UpdatePetWithFormStatus200, ResponseErrorConfig<Error>, UpdatePetWithFormData>({
    method: 'POST',
    url: getUpdatePetWithFormUrl({ petId }).url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res.data
}
