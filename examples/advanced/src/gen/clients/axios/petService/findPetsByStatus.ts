import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type { FindPetsByStatusPathStepId, FindPetsByStatusResponse, FindPetsByStatusStatus400 } from '../../../models/ts/petController/FindPetsByStatus.ts'
import { findPetsByStatusResponseSchema } from '../../../zod/petController/findPetsByStatusSchema.ts'

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
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<FindPetsByStatusResponse, ResponseErrorConfig<FindPetsByStatusStatus400>, unknown>({
    method: 'GET',
    url: getFindPetsByStatusUrl({ stepId }).url.toString(),
    ...requestConfig,
  })

  return { ...res, data: findPetsByStatusResponseSchema.parse(res.data) }
}
