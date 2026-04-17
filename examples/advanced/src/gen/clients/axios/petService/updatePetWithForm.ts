import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type {
  UpdatePetWithFormPathPetId,
  UpdatePetWithFormQueryName,
  UpdatePetWithFormQueryStatus,
  UpdatePetWithFormResponse,
  UpdatePetWithFormStatus405,
} from '../../../models/ts/petController/UpdatePetWithForm.ts'
import { updatePetWithFormResponseSchema } from '../../../zod/petController/updatePetWithFormSchema.ts'

export function getUpdatePetWithFormUrl({ petId }: { petId: UpdatePetWithFormPathPetId }) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet/${petId}:search` as const }

  return res
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export async function updatePetWithForm(
  { petId, params }: { petId: UpdatePetWithFormPathPetId; params?: { name?: UpdatePetWithFormQueryName; status?: UpdatePetWithFormQueryStatus } },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<UpdatePetWithFormResponse, ResponseErrorConfig<UpdatePetWithFormStatus405>, unknown>({
    method: 'POST',
    url: getUpdatePetWithFormUrl({ petId }).url.toString(),
    params,
    ...requestConfig,
  })

  return { ...res, data: updatePetWithFormResponseSchema.parse(res.data) }
}
