/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { UpdatePetWithFormRequestConfig, UpdatePetWithFormPathPetId, UpdatePetWithFormData, UpdatePetWithFormStatus200 } from './UpdatePetWithForm'
import { client } from './.kubb/client'

function getUpdatePetWithFormUrl({ petId }: { petId: UpdatePetWithFormPathPetId }) {
  const res = { method: 'POST', url: `/pet/${petId}` as const }

  return res
}

/**
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(
  { path, body }: Omit<UpdatePetWithFormRequestConfig, 'url'>,
  config: Partial<RequestConfig<UpdatePetWithFormData>> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const requestBody = body

  const res = await request<UpdatePetWithFormStatus200, ResponseErrorConfig<Error>, UpdatePetWithFormData>({
    method: 'POST',
    url: getUpdatePetWithFormUrl(path).url.toString(),
    body: requestBody,
    ...requestConfig,
  })

  return res.data
}
