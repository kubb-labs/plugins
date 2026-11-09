import type { CallToolResult, ServerContext } from '@modelcontextprotocol/server'
import { uploadFile } from '../../clients/axios/petService/uploadFile'

/**
 * `POST /pet/{petId}/uploadImage`
 * @summary uploads an image
 */
export async function uploadFileHandler(
  {
    path,
    query,
    body,
  }: {
    body: Blob
    path: {
      petId: number
    }
    query?: {
      additionalMetadata?: string
    }
    headers?: never
  },
  ctx: ServerContext,
): Promise<CallToolResult> {
  const res = await uploadFile({ path, query, body, signal: ctx.mcpReq.signal, throwOnError: true })

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
