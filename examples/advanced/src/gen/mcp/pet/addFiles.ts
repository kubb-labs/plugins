import client from '../../../axios-client.ts'
import type { ResponseErrorConfig } from '../../../axios-client.ts'
import type { AddFilesData, AddFilesResponse, AddFilesStatus405 } from '../../models/ts/pet/AddFiles.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFilesHandler(
  { data }: { data: AddFilesData },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const requestData = data

  const res = await client<AddFilesResponse, ResponseErrorConfig<AddFilesStatus405>, AddFilesData>(
    { method: 'POST', url: `/pet/files`, baseURL: `https://petstore.swagger.io/v2`, data: requestData },
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
