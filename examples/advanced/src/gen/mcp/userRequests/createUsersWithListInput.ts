import fetch from '@kubb/plugin-client/clients/axios'
import type { CreateUsersWithListInputData, CreateUsersWithListInputResponse } from '../../models/ts/userController/CreateUsersWithListInput.ts'
import type { ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Creates list of users with given input array
 * @summary Creates list of users with given input array
 * {@link /user/createWithList}
 */
export async function createUsersWithListInputHandler({ data }: { data?: CreateUsersWithListInputData } = {}): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await fetch<CreateUsersWithListInputResponse, ResponseErrorConfig<Error>, CreateUsersWithListInputData>({
    method: 'POST',
    url: '/user/createWithList',
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
