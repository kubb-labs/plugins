import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdateUserPathUsername, UpdateUserResponse } from '../../../models/ts/userController/UpdateUser.ts'
import { updateUserResponseSchema } from '../../../zod/userController/updateUserSchema.ts'

export function getUpdateUserUrl({ username }: { username: UpdateUserPathUsername }) {
  const res = { method: 'PUT', url: `https://petstore3.swagger.io/api/v3/user/${username}` as const }

  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export async function updateUser(
  { username, data }: { username: UpdateUserPathUsername; data?: UpdateUserData },
  config: Partial<RequestConfig> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<UpdateUserResponse, ResponseErrorConfig<Error>, unknown>({
    method: 'PUT',
    url: getUpdateUserUrl({ username }).url.toString(),
    ...requestConfig,
  })

  return { ...res, data: updateUserResponseSchema.parse(res.data) }
}
