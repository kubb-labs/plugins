import fetch from '../../client.js'
import type { ResponseErrorConfig } from '../../client.js'
import type { AddFilesResponse, AddFilesStatus405 } from '../models/ts/AddFiles.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types'

/**
 * @description Place a new file in the store
 * @summary Place an file for a pet
 * {@link /pet/files}
 */
export async function addFilesHandler({ data }: { data?: AddFilesData } = {}): Promise<Promise<CallToolResult>> {
  const res = await fetch<AddFilesResponse, ResponseErrorConfig<AddFilesStatus405>, unknown>({
    method: 'POST',
    url: `/pet/files`,
    baseURL: `https://petstore.swagger.io/v2`,
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
