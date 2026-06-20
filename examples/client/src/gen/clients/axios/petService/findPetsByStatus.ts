/* eslint-disable no-alert, no-console */

import type { Options, RequestResult } from '../../../.kubb/client.js'
import type { FindPetsByStatusRequestConfig, FindPetsByStatusResponses } from '../../../models/ts/pet/FindPetsByStatus.js'
import { client } from '../../../.kubb/client.js'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus}
 */
export function findPetsByStatus<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByStatusRequestConfig, ThrowOnError>,
): Promise<RequestResult<FindPetsByStatusResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'GET', url: '/pet/findByStatus', ...config }) as Promise<RequestResult<FindPetsByStatusResponses, ThrowOnError>>
}
