/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { AddPetRequestConfig, AddPetResponses } from './AddPet'
import { client } from './.kubb/client'
import { AddPetResponse } from './AddPet'

export type AddPetRequest = {
  body: AddPetRequestConfig['data']
  path?: AddPetRequestConfig['pathParams']
  query?: AddPetRequestConfig['queryParams']
  headers?: AddPetRequestConfig['headerParams']
  url: AddPetRequestConfig['url']
}

/**
 * {@link /pet}
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetRequest, ThrowOnError>,
): Promise<RequestResult<AddPetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/pet', responseValidator: (data: unknown) => AddPetResponse.parse(data), ...config }) as Promise<
    RequestResult<AddPetResponses, ThrowOnError>
  >
}
