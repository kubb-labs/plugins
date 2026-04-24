/* eslint-disable no-alert, no-console */

import fetch from '@kubb/plugin-client/clients/fetch'
import type { AddPetResponse, AddPetStatus405 } from '../../../models/ts/petController/AddPet.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getAddPetUrl() {
  const res = { method: 'POST', url: `/pet` as const }

  return res
}

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export async function addPet(data: AddPetData, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<AddPetResponse, ResponseErrorConfig<AddPetStatus405>, unknown>({
    method: 'POST',
    url: getAddPetUrl().url.toString(),
    ...requestConfig,
  })

  return res.data
}
