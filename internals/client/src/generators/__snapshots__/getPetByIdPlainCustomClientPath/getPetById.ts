/* eslint-disable no-alert, no-console */

import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById'
import type { Options, RequestResult } from '@acme/api-client'
import { client } from '@acme/api-client'

/**
 * `GET /pet/{petId}`
 * @param options - The request (`path`) and per-call settings, such as `client` and `throwOnError`.
 * @returns The result with `data` or `error`, `status`, `request`, and `response`.
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdOptions, ThrowOnError>,
): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pet/{petId}', ...config, throwOnError: config.throwOnError ?? true }) as Promise<
    RequestResult<GetPetByIdResponses, ThrowOnError>
  >
}
