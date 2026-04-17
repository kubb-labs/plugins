import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { ResponseErrorConfig } from '../../client.js'
import fetch from '../../client.js'
import type { LoginUserQueryPassword, LoginUserQueryUsername, LoginUserResponse, LoginUserStatus400 } from '../models/ts/LoginUser.js'

/**
 * @summary Logs user into the system
 * {@link /user/login}
 */
export async function loginUserHandler({
  params,
}: {
  params?: { username?: LoginUserQueryUsername; password?: LoginUserQueryPassword }
} = {}): Promise<Promise<CallToolResult>> {
  const res = await fetch<LoginUserResponse, ResponseErrorConfig<LoginUserStatus400>, unknown>({
    method: 'GET',
    url: '/user/login',
    baseURL: 'https://petstore.swagger.io/v2',
    params,
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
