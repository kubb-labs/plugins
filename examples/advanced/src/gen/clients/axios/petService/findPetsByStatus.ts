import type { Options, RequestResult } from '../../../.kubb/client.ts'
import type { FindPetsByStatusRequestConfig, FindPetsByStatusResponses } from '../../../models/ts/pet/FindPetsByStatus.ts'
import { client } from '../../../.kubb/client.ts'
import { findPetsByStatusResponseSchema } from '../../../zod/pet/findPetsByStatusSchema.ts'

export function getFindPetsByStatusUrl(path: FindPetsByStatusRequestConfig['path']) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/pet/findByStatus/${path.stepId}` as const }

  return res
}

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
    url: '/pet/findByStatus/{step_id}',
    parser: { response: (data: unknown) => findPetsByStatusResponseSchema.parse(data) },
    ...config,
  }) as Promise<RequestResult<FindPetsByStatusResponses, ThrowOnError>>
}
