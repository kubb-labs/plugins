/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type { Pet } from '../../../models/ts/Pet.js'
import type { AddPetData, AddPetStatus405 } from '../../../models/ts/petController/AddPet.js'
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
export async function addPet(
  data: AddPetData,
  config: Partial<RequestConfig<AddPetData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestData = data

  const res = await request<Pet, ResponseErrorConfig<AddPetStatus405>, AddPetData>({
    method: 'POST',
    url: getAddPetUrl().url.toString(),
    data: requestData,
    contentType,
    ...requestConfig,
  })

  return res.data
}
