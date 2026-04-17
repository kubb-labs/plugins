import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'
import type { CreateUserData, CreateUserResponse } from '../../models/ts/userController/CreateUser.ts'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUserHandler({ data }: { data?: CreateUserData } = {}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreateUserResponse, ResponseErrorConfig<Error>, CreateUserData>({
    method: 'POST',
    url: '/user',
    baseURL: 'https://petstore.swagger.io/v2',
    data: requestData,
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
