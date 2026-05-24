import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { User } from '../../../models/ts/User.ts'
import type { GetUserByNamePathUsername, GetUserByNameStatus400, GetUserByNameStatus404 } from '../../../models/ts/userController/GetUserByName.ts'
import { getUserByNameResponseSchema } from '../../../zod/userController/getUserByNameSchema.ts'

export function getGetUserByNameUrl({ username }: { username: GetUserByNamePathUsername }) {
  const res = { method: 'GET', url: `https://petstore3.swagger.io/api/v3/user/${username}` as const }

  return res
}

/**
 * @summary Get user by user name
 * {@link /user/:username}
 */
export async function getUserByName({ username }: { username: GetUserByNamePathUsername }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = client, ...requestConfig } = config

  const res = await request<User, ResponseErrorConfig<GetUserByNameStatus400 | GetUserByNameStatus404>, unknown>({
    method: 'GET',
    url: getGetUserByNameUrl({ username }).url.toString(),
    ...requestConfig,
  })

  return { ...res, data: getUserByNameResponseSchema.parse(res.data) }
}
