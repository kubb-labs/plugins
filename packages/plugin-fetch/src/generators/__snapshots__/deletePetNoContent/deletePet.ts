/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { DeletePetRequestConfig, DeletePetResponses } from './DeletePet'
import { client } from './.kubb/client'

export type DeletePetRequest = {
  body?: DeletePetRequestConfig['data']
  path?: DeletePetRequestConfig['pathParams']
  query?: DeletePetRequestConfig['queryParams']
  headers?: DeletePetRequestConfig['headerParams']
  url: DeletePetRequestConfig['url']
}

/**
 * {@link /pet/:petId}
 */
export function deletePet<ThrowOnError extends boolean = true>(
  options: Options<DeletePetRequest, ThrowOnError>,
): Promise<RequestResult<DeletePetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'DELETE', url: '/pet/{petId}', ...config }) as Promise<RequestResult<DeletePetResponses, ThrowOnError>>
}
