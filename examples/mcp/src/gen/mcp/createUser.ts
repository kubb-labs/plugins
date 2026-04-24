import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { CreateUserResponse } from '../models/ts/CreateUser.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUserHandler({ data }: { data?: CreateUserData } = {}): Promise<Promise<CallToolResult>> {
  const res = await fetch<CreateUserResponse, ResponseErrorConfig<Error>, unknown>({ method: 'POST', url: `/user`, baseURL: `https://petstore.swagger.io/v2` })

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
