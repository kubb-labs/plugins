/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type {
  UpdatePetWithFormRequestConfig,
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormResponse,
  UpdatePetWithFormStatus405,
} from '../../../models/ts/pet/UpdatePetWithForm.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getUpdatePetWithFormUrl({ petId }: { petId: UpdatePetWithFormPathPetId }) {
  const res = { method: 'POST', url: `/pet/${petId}` as const }

  return res
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId}
 */
export async function updatePetWithForm(
  { path, query }: Omit<UpdatePetWithFormRequestConfig, 'url'>,
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, unknown>({
    method: 'POST',
    url: getUpdatePetWithFormUrl(path).url.toString(),
    query,
    ...requestConfig,
  })

  return res.data
}
