/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client.ts'
import type { GetPetByIdOptions, GetPetByIdResponses } from './GetPetById.ts'
import { client } from './.kubb/client.ts'

/**
 * {@link /pet/:petId}
 */
export function getPetById<ThrowOnError extends boolean = true>(
  options: Options<GetPetByIdOptions, ThrowOnError>,
): Promise<RequestResult<GetPetByIdResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'GET',
    url: '/pet/{petId}',
    security: [{ type: 'oauth2' }, { type: 'apiKey', name: 'api_key', in: 'header' }],
    ...config,
  }) as Promise<RequestResult<GetPetByIdResponses, ThrowOnError>>
}
