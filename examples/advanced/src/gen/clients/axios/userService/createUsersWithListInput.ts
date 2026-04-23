import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUsersWithListInputResponse } from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUsersWithListInputResponseSchema } from '../../../zod/userController/createUsersWithListInputSchema.ts'

export function getCreateUsersWithListInputUrl() {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/user/createWithList` as const }

  return res
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInput(
  { data }: { data?: CreateUsersWithListInputData } = {},
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<CreateUsersWithListInputResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: getCreateUsersWithListInputUrl().url.toString(),
    ...requestConfig,
  })

  return { ...res, data: createUsersWithListInputResponseSchema.parse(res.data) }
}
