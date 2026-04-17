/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'
import fetch from '@kubb/plugin-client/clients/fetch'
import type {
  UpdatePetData,
  UpdatePetResponse,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/petController/UpdatePet.js'

function getUpdatePetUrl() {
  const res = { method: 'PUT', url: '/pet' as const }

  return res
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePet(data: UpdatePetData, config: Partial<RequestConfig<UpdatePetData>> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = data

  const res = await request<UpdatePetResponse, ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>, UpdatePetData>({
    method: 'PUT',
    url: getUpdatePetUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return res.data
}
