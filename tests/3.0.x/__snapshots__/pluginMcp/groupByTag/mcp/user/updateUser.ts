import type { ResponseErrorConfig } from '../../.kubb/client.ts'
import type { UpdateUserData, UpdateUserPathUsername, UpdateUserResponse } from '../../types/UpdateUser.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../../.kubb/client.ts'

/**
 * @description This can only be done by the logged in user.
 * @summary Update user
 * {@link /user/:username}
 */
export async function updateUserHandler({ username, data }: { username: UpdateUserPathUsername; data?: UpdateUserData }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await client<UpdateUserResponse, ResponseErrorConfig<Error>, UpdateUserData>({ method: "PUT", url: `/user/${username}`, data: requestData }, request)

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(res.data)
      }
    ],
    structuredContent: { data: res.data }
  }
}