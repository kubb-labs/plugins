import type { UploadFileData, UploadFilePathPetId, UploadFileQueryAdditionalMetadata } from '../../types/UploadFile.ts'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from '../../.kubb/client.ts'

/**
 * @summary uploads an image
 * {@link /pet/:petId/uploadImage}
 */
export async function uploadFileHandler({ petId, data, params }: { petId: UploadFilePathPetId; data?: UploadFileData; params?: { additionalMetadata?: UploadFileQueryAdditionalMetadata } }, request: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<Promise<CallToolResult>> {
  const requestBody = data

  const res = await client({ method: "POST", url: `/pet/${petId}/uploadImage`, query: params, body: requestBody, contentType: 'application/octet-stream' })

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