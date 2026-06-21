import type { UploadFileRequestConfig } from './UploadFile'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { uploadFile } from './clients/uploadFile'

/**
 * {@link /pets/:petId/upload}
 */
export async function uploadFileHandler(
  { path, body }: UploadFileRequestConfig,
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const res = await uploadFile({ path, body })

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
