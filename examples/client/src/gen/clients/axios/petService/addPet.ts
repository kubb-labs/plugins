/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from '../../../.kubb/client.js'
import type { AddPetRequestConfig, AddPetResponses } from '../../../models/ts/pet/AddPet.js'
import { client } from '../../../.kubb/client.js'

/**
 * @description Add a new pet to the store
 * @summary Add a new pet to the store
 * {@link /pet}
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetRequestConfig, ThrowOnError>,
): Promise<RequestResult<AddPetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/pet', ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>
}
