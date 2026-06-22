/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client'
import type { GetPetByIdRequestConfig, GetPetByIdResponses } from './GetPetById'
import { client } from './.kubb/client'

/**
 * {@link /pet/:petId}
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdRequestConfig, ThrowOnError>,
): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'GET',
    url: '/pet/{petId}',
    security: [{ petstore_auth: ['read:pets'] }, { api_key: [] }],
    schemes: { petstore_auth: { type: 'http', scheme: 'bearer' }, api_key: { type: 'apiKey', name: 'api_key', in: 'header' } },
    ...config,
  }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>
}
