/* eslint-disable no-alert, no-console */

import type { Client, RequestConfig, ResponseErrorConfig } from '../../../.kubb/client.js'
import type { AddPetData, AddPetStatus200, AddPetStatus405 } from '../../../models/ts/pet/AddPet.js'
import { client } from '../../../.kubb/client.js'

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

  const res = await request<AddPetStatus200, ResponseErrorConfig<AddPetStatus405>, AddPetData>({
    method: 'POST',
    url: getAddPetUrl().url.toString(),
    data: requestData,
    contentType,
    ...requestConfig,
  })

  return res.data
}
