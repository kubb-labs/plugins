import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type {
  CreateUsersWithListInputData,
  CreateUsersWithListInputStatus200,
  CreateUsersWithListInputStatusDefault,
} from '../../../models/ts/user/CreateUsersWithListInput.ts'
import { createUsersWithListInputResponseSchema, createUsersWithListInputDataSchema } from '../../../zod/user/createUsersWithListInputSchema.ts'

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
  config: Partial<RequestConfig<CreateUsersWithListInputData>> & { client?: Client } = {},
) {
  const { client: request = client, ...requestConfig } = config

  const requestData = createUsersWithListInputDataSchema.parse(data)

  const res = await request<
    CreateUsersWithListInputStatus200 | CreateUsersWithListInputStatusDefault,
    ResponseErrorConfig<Error>,
    CreateUsersWithListInputData
  >({ method: 'POST', url: getCreateUsersWithListInputUrl().url.toString(), data: requestData, ...requestConfig })

  return { ...res, data: createUsersWithListInputResponseSchema.parse(res.data) } as
    | { status: 200; data: CreateUsersWithListInputStatus200; statusText: string }
    | { status: number; data: CreateUsersWithListInputStatusDefault; statusText: string }
}
