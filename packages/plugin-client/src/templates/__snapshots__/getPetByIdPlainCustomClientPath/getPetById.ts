/* eslint-disable no-alert, no-console */

import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import type { Options, RequestResult } from '@acme/api-client'
import { client } from '@acme/api-client'

/**
 * `GET /pet/{petId}`
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdOptions, ThrowOnError>,
): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: apiClient = client, ...config } = options

  return apiClient<GetPetByIdResponses, ThrowOnError>({ method: 'GET', url: '/pet/{petId}', ...config, throwOnError: config.throwOnError ?? true })
}
