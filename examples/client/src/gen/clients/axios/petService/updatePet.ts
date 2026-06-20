/* eslint-disable no-alert, no-console */

import client from '@kubb/plugin-client/clients/fetch'
import type {
  UpdatePetRequestConfig,
  UpdatePetData,
  UpdatePetStatus200,
  UpdatePetStatus400,
  UpdatePetStatus404,
  UpdatePetStatus405,
} from '../../../models/ts/pet/UpdatePet.js'
import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/fetch'

function getUpdatePetUrl() {
  const res = { method: 'PUT', url: `/pet` as const }

  return res
}

/**
 * @description Update an existing pet by Id
 * @summary Update an existing pet
 * {@link /pet}
 */
export async function updatePet(
  { body }: UpdatePetRequestConfig,
  config: Partial<RequestConfig<UpdatePetData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestBody = body

  const res = await request<UpdatePetStatus200, ResponseErrorConfig<UpdatePetStatus400 | UpdatePetStatus404 | UpdatePetStatus405>, UpdatePetData>({
    method: 'PUT',
    url: getUpdatePetUrl().url.toString(),
    body: requestBody,
    contentType,
    ...requestConfig,
  })

  return res.data
}
