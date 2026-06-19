/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from './.kubb/client'
import type { UpdatePetWithFormRequestConfig, UpdatePetWithFormData, UpdatePetWithFormStatus200 } from './UpdatePetWithForm'
import { client } from './.kubb/client'
import { UpdatePetWithFormData } from './UpdatePetWithForm'

export function getUpdatePetWithFormUrl(path: UpdatePetWithFormRequestConfig['path']) {
  const res = { method: 'POST', url: `/pet/${path.petId}` as const }

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

  const requestBody = UpdatePetWithFormData.parse(body)

  const res = await request<UpdatePetWithFormStatus200, ResponseErrorConfig<Error>, UpdatePetWithFormData>({
    method: 'POST',
    url: getUpdatePetWithFormUrl(path).url.toString(),
    body: requestBody,
    ...requestConfig,
  })

  return res.data
}
