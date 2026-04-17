import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUsersWithListInputData, CreateUsersWithListInputResponse } from '../../../models/ts/userController/CreateUsersWithListInput.ts'
import { createUsersWithListInputResponseSchema, createUsersWithListInputDataSchema } from '../../../zod/userController/createUsersWithListInputSchema.ts'

export function getCreateUsersWithListInputUrl() {
  const res = { method: 'POST', url: 'https://petstore3.swagger.io/api/v3/user/createWithList' as const }

  return res
}

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInput(
  { data }: { data?: CreateUsersWithListInputData } = {},
  config: Partial<RequestConfig<CreateUsersWithListInputData>> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = createUsersWithListInputDataSchema.parse(data)

  const res = await request<CreateUsersWithListInputResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputData>({
    method: 'POST',
    url: getCreateUsersWithListInputUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return { ...res, data: createUsersWithListInputResponseSchema.parse(res.data) }
}
