import client from '../../../axios-client.ts'
import type { ResponseErrorConfig } from '../../../axios-client.ts'
import type { LogoutUserResponse } from '../../models/ts/user/LogoutUser.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @summary Logs out current logged in user session
 * {@link /user/logout}
 */
export async function logoutUserHandler(request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const res = await client<LogoutUserResponse, ResponseErrorConfig<Error>, unknown>(
    { method: 'GET', url: `/user/logout`, baseURL: `https://petstore.swagger.io/v2` },
    request,
  )

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
