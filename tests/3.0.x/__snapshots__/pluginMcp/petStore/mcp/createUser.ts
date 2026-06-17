import type { ResponseErrorConfig } from '../.kubb/client.ts'
import type { CreateUserData, CreateUserResponse } from '../types/CreateUser.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.ts'

/**
 * @description This can only be done by the logged in user.
 * @summary Create user
 * {@link /user}
 */
export async function createUserHandler({ data }: { data?: CreateUserData } = {}, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await client<CreateUserResponse, ResponseErrorConfig<Error>, CreateUserData>({ method: "POST", url: `/user`, data: requestData }, request)

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