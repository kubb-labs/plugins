import client from '../../../../axios-client.ts'
import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import type { UpdateUserPathUsername, UpdateUserData, UpdateUserResponse } from '../../../models/ts/user/UpdateUser.ts'
import { updateUserResponseSchema, updateUserDataSchema } from '../../../zod/user/updateUserSchema.ts'

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
  config: Partial<RequestConfig<UpdateUserData>> & {
    client?: Client
    contentType?: 'application/json' | 'application/xml' | 'application/x-www-form-urlencoded'
  } = {},
) {
  const { client: request = client, contentType = 'application/json', ...requestConfig } = config

  const requestData = updateUserDataSchema.parse(data)

  const res = await request<UpdateUserResponse, ResponseErrorConfig<Error>, UpdateUserData>({
    method: 'PUT',
    url: getUpdateUserUrl({ username }).url.toString(),
    data: requestData,
    contentType,
    ...requestConfig,
  })

  return { ...res, data: updateUserResponseSchema.parse(res.data) }
}
