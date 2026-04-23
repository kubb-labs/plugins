import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { DeleteUserPathUsername, DeleteUserResponse, DeleteUserStatus400, DeleteUserStatus404 } from '../models/ts/DeleteUser.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description This can only be done by the logged in user.
 * @summary Delete user
 * {@link /user/:username}
 */
export async function deleteUserHandler({ username }: { username: DeleteUserPathUsername }): Promise<Promise<CallToolResult>> {
  const res = await fetch<DeleteUserResponse, ResponseErrorConfig<DeleteUserStatus400 | DeleteUserStatus404>, unknown>({
    method: 'DELETE',
    url: `/user/${username}`,
    baseURL: `https://petstore.swagger.io/v2`,
  })

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data),
      },
    ],
    structuredContent: { data: res.data },
  }
}
