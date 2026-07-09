/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from './.kubb/client.ts'
import type { AddPetOptions, AddPetResponses } from './AddPet.ts'
import { client } from './.kubb/client.ts'

/**
 * {@link /pet}
 */
export function addPet<ThrowOnError extends boolean = true>(
  options: Options<AddPetOptions, ThrowOnError>,
): Promise<RequestResult<AddPetResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/pet', security: [{ type: 'oauth2' }], ...config }) as Promise<RequestResult<AddPetResponses, ThrowOnError>>
}
