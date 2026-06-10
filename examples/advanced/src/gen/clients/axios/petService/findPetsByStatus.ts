import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { FindPetsByStatusPathStepId, FindPetsByStatusStatus200, FindPetsByStatusStatus400 } from '../../../models/ts/pet/FindPetsByStatus.ts'
import { findPetsByStatusResponseSchema } from '../../../zod/pet/findPetsByStatusSchema.ts'

export function getFindPetsByStatusUrl({ stepId }: { stepId: FindPetsByStatusPathStepId }) {
  const step_id = stepId

  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/pet/findByStatus/${step_id}` as const }

  return res
}

/**
 * @description Multiple status values can be provided with comma separated strings
 * @summary Finds Pets by status
 * {@link /pet/findByStatus/:step_id}
 */
export async function findPetsByStatus({ stepId }: { stepId: FindPetsByStatusPathStepId }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<FindPetsByStatusStatus200 | FindPetsByStatusStatus400, ResponseErrorConfig<FindPetsByStatusStatus400>, unknown>({
    method: 'GET',
    url: getFindPetsByStatusUrl({ stepId }).url.toString(),
    ...requestConfig,
  })

  return { ...res, data: findPetsByStatusResponseSchema.parse(res.data) } as
    | { status: 200; data: FindPetsByStatusStatus200; statusText: string }
    | { status: 400; data: FindPetsByStatusStatus400; statusText: string }
}
