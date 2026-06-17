import type { ResponseErrorConfig } from '../.kubb/client.ts'
import type { CreateUsersWithListInputData, CreateUsersWithListInputResponse } from '../types/CreateUsersWithListInput.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../.kubb/client.ts'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInputHandler({ data }: { data?: CreateUsersWithListInputData } = {}, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await client<CreateUsersWithListInputResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputData>({ method: "POST", url: `/user/createWithList`, data: requestData }, request)

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