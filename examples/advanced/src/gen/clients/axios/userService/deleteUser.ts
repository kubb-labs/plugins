import type { Client, RequestConfig, ResponseErrorConfig } from '../../../../axios-client.ts'
import fetch from '../../../../axios-client.ts'
import type { DeleteUserPathUsername, DeleteUserResponse, DeleteUserStatus400, DeleteUserStatus404 } from '../../../models/ts/userController/DeleteUser.ts'
import { deleteUserResponseSchema } from '../../../zod/userController/deleteUserSchema.ts'

export function getDeleteUserUrl({ username }: { username: DeleteUserPathUsername }) {
  const res = { method: 'DELETE', url: `https://petstore3.swagger.io/api/v3/user/${username}` as const }

  return res
}

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUser({ username }: { username: DeleteUserPathUsername }, config: Partial<RequestConfig> & { client?: Client } = {}) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<DeleteUserResponse, ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>, unknown>({
    method: 'DELETE',
    url: getDeleteUserUrl({ username }).url.toString(),
    ...requestConfig,
  })

  return { ...res, data: deleteUserResponseSchema.parse(res.data) }
}
