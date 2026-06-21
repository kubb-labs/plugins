import type { UploadFileData, UploadFilePathPetId } from './UploadFile'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from './.kubb/client'

/**
 * {@link /pets/:petId/upload}
 */
export async function uploadFileHandler(
  { petId, data }: { petId: UploadFilePathPetId; data?: UploadFileData },
  request: RequestHandlerExtra<ServerRequest, ServerNotification>,
): Promise<Promise<CallToolResult>> {
  const requestBody = data

  const res = await client({ method: 'POST', url: `/pets/${petId}/upload`, body: requestBody, contentType: 'multipart/form-data' })

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
