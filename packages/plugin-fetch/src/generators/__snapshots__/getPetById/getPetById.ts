/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { GetPetByIdRequestConfig, GetPetByIdResponses } from './GetPetById'
import { client } from './.kubb/client'

export type GetPetByIdRequest = {
  body?: GetPetByIdRequestConfig['data']
  path?: GetPetByIdRequestConfig['pathParams']
  query?: GetPetByIdRequestConfig['queryParams']
  headers?: GetPetByIdRequestConfig['headerParams']
  url: GetPetByIdRequestConfig['url']
}

/**
 * {@link /pet/:petId}
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdRequest, ThrowOnError>,
): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pet/{petId}', ...config }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>
}
