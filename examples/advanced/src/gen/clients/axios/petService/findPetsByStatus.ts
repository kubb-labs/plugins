import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { FindPetsByStatusRequestConfig, FindPetsByStatusResponses } from '../../../models/ts/pet/FindPetsByStatus.ts'
import { client } from '../../../.kubb/client.ts'
import { findPetsByStatusResponseSchema, findPetsByStatusErrorSchema } from '../../../zod/pet/findPetsByStatusSchema.ts'

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export function findPetsByStatus<ThrowOnError extends boolean = true>(
  options: Options<FindPetsByStatusRequestConfig, ThrowOnError>,
): Promise<RequestResult<FindPetsByStatusResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({
    method: 'GET',
    url: '/pet/findByStatus/{stepId}',
    security: [{ type: 'oauth2' }],
    parser: { response: findPetsByStatusResponseSchema, error: findPetsByStatusErrorSchema },
    ...config,
  }) as Promise<RequestResult<FindPetsByStatusResponses, ThrowOnError>>
}
