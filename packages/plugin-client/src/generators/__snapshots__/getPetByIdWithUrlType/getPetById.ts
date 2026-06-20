/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { GetPetByIdRequestConfig, GetPetByIdResponses } from './GetPetById'
import { client } from './.kubb/client'

export function getGetPetByIdUrl(path: GetPetByIdRequestConfig['path']) {
  const res = { method: 'GET', url: `/pet/${path.petId}` as const }

  return res
}

/**
 * {@link /pet/:petId}
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdRequestConfig, ThrowOnError>,
): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pet/{petId}', ...config }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>
}
