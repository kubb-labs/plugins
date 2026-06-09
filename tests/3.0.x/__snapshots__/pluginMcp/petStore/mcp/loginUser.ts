import client from '@kubb/plugin-client/clients/axios'
import type { LoginUserQueryPassword, LoginUserQueryUsername, LoginUserResponse, LoginUserStatus400 } from '../types/LoginUser.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUserHandler({ params }: { params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword } } = {}, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {




  const res = await client<LoginUserResponse, ResponseErrorConfig<LoginUserStatus400>, unknown>({ method: "GET", url: `/user/login`, params }, request)

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