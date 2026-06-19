import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdatePetWithFormRequestConfig, UpdatePetWithFormStatus405 } from '../../../models/ts/pet/UpdatePetWithForm.ts'
import { updatePetWithFormResponseSchema } from '../../../zod/pet/updatePetWithFormSchema.ts'

export function getUpdatePetWithFormUrl(path: UpdatePetWithFormRequestConfig['path']) {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/pet/${path.petId}:search` as const }

  return res
}

/**
 * @summary Updates a pet in the store with form data
 * {@link /pet/:petId:search}
 */
export async function updatePetWithForm(
  { path, query }: Omit<UpdatePetWithFormRequestConfig, 'url'>,
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<UpdatePetWithFormStatus405, ResponseErrorConfig<UpdatePetWithFormStatus405>, unknown>({
    method: 'POST',
    url: getUpdatePetWithFormUrl(path).url.toString(),
    query,
    ...requestConfig,
  })

  return { ...res, data: updatePetWithFormResponseSchema.parse(res.data) } as { status: 405; data: UpdatePetWithFormStatus405; statusText: string }
}
