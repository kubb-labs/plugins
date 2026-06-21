import type { Options, RequestResult } from './.kubb/client'
import type { UploadFileRequestConfig, UploadFileResponses } from './UploadFile'
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol'
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types'
import { client } from './.kubb/client'

/**
 * {@link /pets/:petId/upload}
 */
export function uploadFile<ThrowOnError extends boolean = true>(
  options: Options<UploadFileRequestConfig, ThrowOnError>,
): Promise<RequestResult<UploadFileResponses, ThrowOnError>> {
  const { client: request = client, ...config } = options

  return request({ method: 'POST', url: '/pets/{petId}/upload', ...config }) as Promise<RequestResult<UploadFileResponses, ThrowOnError>>
}

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
