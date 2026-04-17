import fetch from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdateUserPathUsername, UpdateUserData, UpdateUserResponse } from '../../../models/ts/userController/UpdateUser.ts'
import { updateUserResponseSchema, updateUserDataSchema } from '../../../zod/userController/updateUserSchema.ts'

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
  config: Partial<RequestConfig<UpdateUserData>> & { client?: Client } = {},
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = updateUserDataSchema.parse(data)

  const res = await request<UpdateUserResponse, ResponseErrorConfig<Error>, UpdateUserData>({
    method: 'PUT',
    url: getUpdateUserUrl({ username }).url.toString(),
    data: requestData,
    ...requestConfig,
  })

  return { ...res, data: updateUserResponseSchema.parse(res.data) }
}
