import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { CreateUserResponse } from '../../../models/ts/userController/CreateUser.ts'
import { createUserResponseSchema } from '../../../zod/userController/createUserSchema.ts'

export function getCreateUserUrl() {
  const res = { method: 'POST', url: `https://petstore3.swagger.io/api/v3/user` as const }

  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUser({ data }: { data?: CreateUserData } = {}, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<CreateUserResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'POST',
    url: getCreateUserUrl().url.toString(),
    ...requestConfig,
  })

  return { ...res, data: createUserResponseSchema.parse(res.data) }
}
