import type { Options, RequestResult } from '../../../.kubb/client'
import type { FindPetsByStatusOptions, FindPetsByStatusResponses } from '../../../models/ts/pet/FindPetsByStatus'
import { client } from '../../../.kubb/client'
import { findPetsByStatusResponseSchema, findPetsByStatusErrorSchema } from '../../../zod/pet/findPetsByStatusSchema'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export function findPetsByStatus<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByStatusOptions, ThrowOnError>,
): Promise<RequestResult<FindPetsByStatusResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'GET',
    url: '/pet/findByStatus/{step_id}',
    security: [{ type: 'oauth2' }],
    validator: { response: findPetsByStatusResponseSchema, error: findPetsByStatusErrorSchema },
    ...config,
  }) as Promise<RequestResult<FindPetsByStatusResponses, ThrowOnError>>
}
